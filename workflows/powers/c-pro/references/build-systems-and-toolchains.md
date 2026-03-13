# Build Systems and Toolchains

## CMake Modern Practices

```cmake
# CMakeLists.txt — modern CMake (3.21+)
cmake_minimum_required(VERSION 3.21)
project(mylib VERSION 1.0.0 LANGUAGES C)

# Set C standard project-wide
set(CMAKE_C_STANDARD 23)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)  # disable GNU extensions for portability

# Library target
add_library(mylib
    src/core.c
    src/parser.c
    src/util.c
)

target_include_directories(mylib
    PUBLIC  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    PRIVATE src/
)

# Compiler warnings as errors
target_compile_options(mylib PRIVATE
    $<$<C_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wpedantic -Werror>
    $<$<C_COMPILER_ID:MSVC>:/W4 /WX>
)

# Sanitizers for debug builds
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    target_compile_options(mylib PRIVATE -fsanitize=address,undefined -fno-omit-frame-pointer)
    target_link_options(mylib PRIVATE -fsanitize=address,undefined)
endif()

# Tests
enable_testing()
add_executable(test_core tests/test_core.c)
target_link_libraries(test_core PRIVATE mylib)
add_test(NAME test_core COMMAND test_core)

# Install rules
install(TARGETS mylib EXPORT mylibTargets)
install(DIRECTORY include/ DESTINATION include)
```

## Meson Build System

```meson
# meson.build — lightweight alternative to CMake
project('mylib', 'c',
    version: '1.0.0',
    default_options: ['c_std=c23', 'warning_level=3', 'werror=true']
)

src = files('src/core.c', 'src/parser.c', 'src/util.c')
inc = include_directories('include')

mylib = library('mylib', src, include_directories: inc)
mylib_dep = declare_dependency(link_with: mylib, include_directories: inc)

# Tests
test_core = executable('test_core', 'tests/test_core.c', dependencies: mylib_dep)
test('core', test_core)
```

## Cross-Compilation

```cmake
# toolchain-arm.cmake — cross-compile for ARM
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm)

set(CMAKE_C_COMPILER arm-linux-gnueabihf-gcc)
set(CMAKE_CXX_COMPILER arm-linux-gnueabihf-g++)

set(CMAKE_FIND_ROOT_PATH /usr/arm-linux-gnueabihf)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

```bash
# Build with cross-compilation toolchain
cmake -B build-arm -DCMAKE_TOOLCHAIN_FILE=toolchain-arm.cmake
cmake --build build-arm
```

## CI Matrix Configuration

```yaml
# GitHub Actions — multi-compiler, multi-platform
jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        compiler: [gcc-13, clang-17]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - name: Configure
        run: |
          cmake -B build \
            -DCMAKE_C_COMPILER=${{ matrix.compiler }} \
            -DCMAKE_BUILD_TYPE=Debug
      - name: Build
        run: cmake --build build
      - name: Test
        run: ctest --test-dir build --output-on-failure
      - name: Sanitizer build
        run: |
          cmake -B build-san \
            -DCMAKE_C_COMPILER=${{ matrix.compiler }} \
            -DCMAKE_BUILD_TYPE=Debug \
            -DENABLE_SANITIZERS=ON
          cmake --build build-san
          ctest --test-dir build-san
```

## Dependency Management

```cmake
# FetchContent for pinned dependencies
include(FetchContent)

FetchContent_Declare(cjson
    GIT_REPOSITORY https://github.com/DaveGamble/cJSON.git
    GIT_TAG        v1.7.17  # pin exact version
)
FetchContent_MakeAvailable(cjson)
target_link_libraries(mylib PRIVATE cjson)

# vcpkg for larger dependency sets
# Install: cmake -B build -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake
```

## Reproducible Builds Checklist

1. Pin compiler version in CI (e.g., `gcc-13`, not `gcc`).
2. Pin all external dependencies to exact versions or commit hashes.
3. Use deterministic build flags (`-frandom-seed=`, `-ffile-prefix-map=`).
4. Commit `CMakePresets.json` or equivalent for consistent local/CI builds.
5. Disable compiler plugins and extensions that vary by environment.
6. Verify with two independent builds and `diffoscope` or binary hash comparison.
