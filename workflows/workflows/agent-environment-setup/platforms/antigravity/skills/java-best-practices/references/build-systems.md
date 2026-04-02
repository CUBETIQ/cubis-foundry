# Build Systems Reference

## Gradle (Kotlin DSL)

### build.gradle.kts Baseline

```kotlin
plugins {
    java
    application
    id("com.google.errorprone") version "4.0.1"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

application {
    mainClass = "com.example.App"
}

tasks.withType<JavaCompile>().configureEach {
    options.compilerArgs.addAll(listOf(
        "-Xlint:all",           // Enable all warnings
        "-Werror",              // Treat warnings as errors
        "--enable-preview",     // If using preview features
    ))
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
    jvmArgs("--enable-preview")
    maxParallelForks = Runtime.getRuntime().availableProcessors()
}

dependencies {
    implementation(libs.slf4j.api)
    implementation(libs.jackson.databind)

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.testcontainers.postgresql)
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    errorprone(libs.errorprone.core)
}
```

### Version Catalogs (libs.versions.toml)

```toml
[versions]
junit = "5.11.3"
jackson = "2.18.1"
slf4j = "2.0.16"
testcontainers = "1.20.3"
errorprone = "2.35.1"

[libraries]
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }
jackson-databind = { module = "com.fasterxml.jackson.core:jackson-databind", version.ref = "jackson" }
jackson-jsr310 = { module = "com.fasterxml.jackson.datatype:jackson-datatype-jsr310", version.ref = "jackson" }
slf4j-api = { module = "org.slf4j:slf4j-api", version.ref = "slf4j" }
testcontainers-postgresql = { module = "org.testcontainers:postgresql", version.ref = "testcontainers" }
errorprone-core = { module = "com.google.errorprone:error_prone_core", version.ref = "errorprone" }

[plugins]
errorprone = { id = "com.google.errorprone", version = "4.0.1" }
```

### Multi-Module Project

```kotlin
// settings.gradle.kts
rootProject.name = "my-service"

include("domain", "service", "api", "infrastructure")

dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            from(files("gradle/libs.versions.toml"))
        }
    }
}

// domain/build.gradle.kts -- pure Java, no frameworks
plugins { java }
dependencies {
    // Domain has minimal dependencies
    implementation(libs.jspecify)
}

// service/build.gradle.kts
plugins { java }
dependencies {
    implementation(project(":domain"))
    implementation(libs.slf4j.api)
}

// api/build.gradle.kts
plugins {
    java
    id("org.springframework.boot") version "3.3.5"
}
dependencies {
    implementation(project(":service"))
    implementation("org.springframework.boot:spring-boot-starter-web")
}
```

### Build Cache and Performance

```kotlin
// gradle.properties
org.gradle.caching=true
org.gradle.configuration-cache=true
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx2g -XX:+UseG1GC

// CI-specific
org.gradle.daemon=false
```

```bash
# Dependency locking for reproducible builds
./gradlew dependencies --write-locks

# Dependency verification (detect tampered artifacts)
./gradlew --write-verification-metadata sha256
# Generates gradle/verification-metadata.xml
```

## Maven

### pom.xml Baseline

```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>my-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.version>5.11.3</junit.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.junit</groupId>
                <artifactId>junit-bom</artifactId>
                <version>${junit.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <release>21</release>
                    <compilerArgs>
                        <arg>-Xlint:all</arg>
                    </compilerArgs>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-enforcer-plugin</artifactId>
                <version>3.5.0</version>
                <executions>
                    <execution>
                        <goals><goal>enforce</goal></goals>
                        <configuration>
                            <rules>
                                <requireMavenVersion>
                                    <version>3.9.0</version>
                                </requireMavenVersion>
                                <requireJavaVersion>
                                    <version>21</version>
                                </requireJavaVersion>
                                <banDuplicatePomDependencyVersions/>
                            </rules>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

## CI Pipeline Best Practices

### GitHub Actions

```yaml
name: Build
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - uses: gradle/actions/setup-gradle@v4
        with:
          cache-read-only: ${{ github.ref != 'refs/heads/main' }}

      - run: ./gradlew build

      - run: ./gradlew test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: '**/build/reports/tests/'
```

### Dependency Audit

```bash
# Gradle: check for vulnerable dependencies
./gradlew dependencyCheckAnalyze  # OWASP dependency-check plugin

# Maven: check for updates
mvn versions:display-dependency-updates
mvn versions:display-plugin-updates

# Both: check module structure
jdeps --multi-release 21 --print-module-deps app.jar
```

## Docker Build

```dockerfile
# Multi-stage build for minimal production image
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon  # Cache dependencies
COPY src/ src/
RUN ./gradlew build -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/app.jar .
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```
