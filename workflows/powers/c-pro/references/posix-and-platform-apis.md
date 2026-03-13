# POSIX and Platform APIs

## File I/O

```c
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>

// Open with explicit permissions
int fd = open("data.bin", O_RDWR | O_CREAT | O_TRUNC, 0644);
if (fd == -1) {
    perror("open");
    return -1;
}

// Read with retry on EINTR
ssize_t safe_read(int fd, void *buf, size_t count) {
    ssize_t n;
    do {
        n = read(fd, buf, count);
    } while (n == -1 && errno == EINTR);
    return n;
}

// Write all bytes (handle partial writes)
ssize_t write_all(int fd, const void *buf, size_t count) {
    const uint8_t *p = buf;
    size_t remaining = count;
    while (remaining > 0) {
        ssize_t n = write(fd, p, remaining);
        if (n == -1) {
            if (errno == EINTR) continue;
            return -1;
        }
        p += n;
        remaining -= n;
    }
    return count;
}

// Always close file descriptors
close(fd);
```

## Memory-Mapped I/O

```c
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>

// Map file for read-only access
void *map_file_readonly(const char *path, size_t *out_size) {
    int fd = open(path, O_RDONLY);
    if (fd == -1) return NULL;

    struct stat st;
    if (fstat(fd, &st) == -1) { close(fd); return NULL; }

    void *addr = mmap(NULL, st.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
    close(fd); // fd can be closed after mmap
    if (addr == MAP_FAILED) return NULL;

    *out_size = st.st_size;
    return addr;
}

// Clean up
munmap(addr, size);
```

## Signal Handling

```c
#include <signal.h>
#include <stdatomic.h>

// Use sig_atomic_t or atomics for signal flags
static volatile sig_atomic_t shutdown_requested = 0;

void handle_signal(int sig) {
    (void)sig;
    shutdown_requested = 1;
    // ONLY async-signal-safe functions are allowed here:
    // write(), _exit(), signal(), abort()
    // DO NOT use printf, malloc, free, etc.
}

void setup_signals(void) {
    struct sigaction sa = {
        .sa_handler = handle_signal,
        .sa_flags = 0,
    };
    sigemptyset(&sa.sa_mask);
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGINT, &sa, NULL);
}

// Main loop checks the flag
while (!shutdown_requested) {
    process_next_item();
}
```

## Process and Fork

```c
#include <sys/wait.h>

// Fork with proper error handling
pid_t pid = fork();
if (pid == -1) {
    perror("fork");
    exit(EXIT_FAILURE);
} else if (pid == 0) {
    // Child process
    execvp(argv[0], argv); // replaces child image
    perror("exec");        // only reached on error
    _exit(127);            // use _exit, not exit, in child after fork
} else {
    // Parent process
    int status;
    waitpid(pid, &status, 0);
    if (WIFEXITED(status)) {
        int exit_code = WEXITSTATUS(status);
    }
}
```

## Socket Programming

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

// TCP server setup
int create_server(uint16_t port) {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd == -1) return -1;

    int opt = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(port),
        .sin_addr.s_addr = INADDR_ANY,
    };

    if (bind(fd, (struct sockaddr *)&addr, sizeof(addr)) == -1) {
        close(fd);
        return -1;
    }

    if (listen(fd, SOMAXCONN) == -1) {
        close(fd);
        return -1;
    }

    return fd;
}
```

## Platform Abstraction Layer Pattern

```c
// platform.h — unified interface
#pragma once

typedef struct platform_file platform_file;

platform_file *platform_open(const char *path, int flags);
ssize_t platform_read(platform_file *f, void *buf, size_t count);
void platform_close(platform_file *f);
uint64_t platform_monotonic_time_ns(void);

// platform_posix.c — POSIX implementation
#if defined(__linux__) || defined(__APPLE__)
#include <time.h>

uint64_t platform_monotonic_time_ns(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000ULL + ts.tv_nsec;
}
#endif

// platform_win32.c — Windows implementation
#if defined(_WIN32)
#include <windows.h>

uint64_t platform_monotonic_time_ns(void) {
    LARGE_INTEGER freq, count;
    QueryPerformanceFrequency(&freq);
    QueryPerformanceCounter(&count);
    return (uint64_t)(count.QuadPart * 1000000000LL / freq.QuadPart);
}
#endif
```

## Error Handling Patterns

```c
// Return error codes with context struct
typedef struct {
    int code;
    const char *message;
    const char *file;
    int line;
} error_t;

#define ERROR(code, msg) ((error_t){ (code), (msg), __FILE__, __LINE__ })
#define OK ((error_t){ 0, NULL, NULL, 0 })

error_t process_file(const char *path) {
    int fd = open(path, O_RDONLY);
    if (fd == -1) return ERROR(errno, "failed to open file");

    // ...
    close(fd);
    return OK;
}

// Goto-based cleanup (idiomatic C error handling)
int init_system(void) {
    int ret = -1;
    void *buf = malloc(BUF_SIZE);
    if (!buf) goto out;

    int fd = open("config", O_RDONLY);
    if (fd == -1) goto cleanup_buf;

    // ... use buf and fd ...
    ret = 0;

    close(fd);
cleanup_buf:
    free(buf);
out:
    return ret;
}
```
