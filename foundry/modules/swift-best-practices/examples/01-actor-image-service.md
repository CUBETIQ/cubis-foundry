# Example: Actor-Based Image Loading Service

## Scenario

Build a SwiftUI app that displays a gallery of images loaded from a remote API. The image loading service must cache results, support concurrent fetches, and cancel in-flight requests when the user navigates away.

## Architecture

- `ImageService` protocol defines the contract
- `CachedImageService` actor implements concurrent loading with an in-memory cache
- `GalleryViewModel` uses @Observable for SwiftUI state management
- Views use `.task` for lifecycle-tied loading

## Protocol Contract

```swift
protocol ImageService: Sendable {
    func loadImage(for url: URL) async throws(ImageLoadError) -> PlatformImage
    func prefetch(urls: [URL]) async
    func clearCache() async
}

enum ImageLoadError: Error, Sendable {
    case networkFailure(URL, underlying: any Error & Sendable)
    case invalidData(URL)
    case cancelled
}
```

## Actor Implementation

```swift
actor CachedImageService: ImageService {
    private var cache: [URL: PlatformImage] = [:]
    private var inFlight: [URL: Task<PlatformImage, any Error>] = [:]
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func loadImage(for url: URL) async throws(ImageLoadError) -> PlatformImage {
        // Return cached image immediately
        if let cached = cache[url] {
            return cached
        }

        // Coalesce concurrent requests for the same URL
        if let existing = inFlight[url] {
            do {
                return try await existing.value
            } catch {
                throw .networkFailure(url, underlying: error)
            }
        }

        // Start a new fetch
        let task = Task<PlatformImage, any Error> {
            let (data, response) = try await session.data(from: url)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw ImageLoadError.networkFailure(url, underlying: URLError(.badServerResponse))
            }
            guard let image = PlatformImage(data: data) else {
                throw ImageLoadError.invalidData(url)
            }
            return image
        }

        inFlight[url] = task
        defer { inFlight[url] = nil }

        do {
            let image = try await task.value
            cache[url] = image
            return image
        } catch is CancellationError {
            throw .cancelled
        } catch let error as ImageLoadError {
            throw error
        } catch {
            throw .networkFailure(url, underlying: error)
        }
    }

    func prefetch(urls: [URL]) async {
        await withTaskGroup(of: Void.self) { group in
            for url in urls where cache[url] == nil {
                group.addTask {
                    _ = try? await self.loadImage(for: url)
                }
            }
        }
    }

    func clearCache() {
        cache.removeAll()
        for (_, task) in inFlight {
            task.cancel()
        }
        inFlight.removeAll()
    }
}
```

## SwiftUI Integration

```swift
@Observable
final class GalleryViewModel {
    var images: [GalleryItem] = []
    var isLoading = false
    var error: ImageLoadError?

    private let imageService: any ImageService

    init(imageService: any ImageService) {
        self.imageService = imageService
    }

    func loadGallery(urls: [URL]) async {
        isLoading = true
        defer { isLoading = false }

        await withTaskGroup(of: (Int, PlatformImage?).self) { group in
            for (index, url) in urls.enumerated() {
                group.addTask {
                    let image = try? await self.imageService.loadImage(for: url)
                    return (index, image)
                }
            }
            for await (index, image) in group {
                if let image {
                    images[index].image = image
                }
            }
        }
    }
}

struct GalleryView: View {
    @State private var viewModel: GalleryViewModel

    init(imageService: any ImageService) {
        _viewModel = State(initialValue: GalleryViewModel(imageService: imageService))
    }

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 120))]) {
                ForEach(viewModel.images) { item in
                    GalleryItemView(item: item)
                }
            }
        }
        .task {
            await viewModel.loadGallery(urls: galleryURLs)
        }
    }
}
```

## Key Decisions

- **Actor for cache** — concurrent gallery loads safely share the cache without locks.
- **Request coalescing** — duplicate URL requests reuse the same in-flight Task.
- **Structured concurrency** — TaskGroup auto-cancels child tasks when the group exits.
- **.task modifier** — automatically cancels the loading task when GalleryView disappears.
- **@Observable** — SwiftUI only redraws cells whose specific `image` property changed.
