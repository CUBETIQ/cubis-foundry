# Go CLI Development

## Cobra (Recommended)

Cobra is the standard Go CLI framework, used by Kubernetes, Hugo, and GitHub CLI.

```bash
go get github.com/spf13/cobra@latest
go get github.com/spf13/viper@latest
```

### Root Command

```go
// cmd/root.go
package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile string
	verbose bool
)

var rootCmd = &cobra.Command{
	Use:   "mycli",
	Short: "A project scaffolding and deployment tool",
	Long: `mycli is a CLI tool for scaffolding projects from templates
and deploying them to various environments.

Complete documentation is available at https://github.com/example/mycli`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.mycli/config.yaml)")
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "enable verbose output")

	// Bind flags to viper
	viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		viper.AddConfigPath(filepath.Join(home, ".mycli"))
		viper.AddConfigPath(".")
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
	}

	viper.SetEnvPrefix("MYCLI")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil {
		if verbose {
			fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
		}
	}
}
```

### Init Subcommand

```go
// cmd/init.go
package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init <name>",
	Short: "Create a new project",
	Long:  `Create a new project from a template with the specified name.`,
	Args:  cobra.ExactArgs(1),
	Example: `  mycli init my-project
  mycli init my-api --template fastapi
  mycli init my-app --template react --force`,
	RunE: func(cmd *cobra.Command, args []string) error {
		name := args[0]
		template, _ := cmd.Flags().GetString("template")
		force, _ := cmd.Flags().GetBool("force")
		noGit, _ := cmd.Flags().GetBool("no-git")

		projectPath := filepath.Join(".", name)

		// Check if directory exists
		if _, err := os.Stat(projectPath); err == nil && !force {
			return fmt.Errorf("directory '%s' already exists (use --force to overwrite)", name)
		}

		info := color.New(color.FgBlue).SprintFunc()
		success := color.New(color.FgGreen).SprintFunc()
		dim := color.New(color.Faint).SprintFunc()

		fmt.Printf("%s Creating project %s with template %s...\n", info("ℹ"), color.New(color.Bold).Sprint(name), color.New(color.Bold).Sprint(template))

		// ... scaffolding logic ...

		if !noGit {
			// ... git init ...
		}

		fmt.Printf("%s Project %s created successfully!\n\n", success("✓"), color.New(color.Bold).Sprint(name))
		fmt.Printf("  %s cd %s\n", dim("$"), name)
		fmt.Printf("  %s go mod tidy\n", dim("$"))
		fmt.Printf("  %s go run .\n\n", dim("$"))

		return nil
	},
}

func init() {
	rootCmd.AddCommand(initCmd)

	initCmd.Flags().StringP("template", "t", "default", "project template (default, fastapi, react)")
	initCmd.Flags().BoolP("force", "f", false, "overwrite existing directory")
	initCmd.Flags().Bool("no-git", false, "skip git initialization")
}
```

### Deploy Subcommand

```go
// cmd/deploy.go
package cmd

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var deployCmd = &cobra.Command{
	Use:   "deploy",
	Short: "Deploy to target environment",
	Long:  `Deploy the current project to the specified environment.`,
	Example: `  mycli deploy --env production
  mycli deploy --env staging --dry-run
  mycli deploy --env production --tag v1.2.0`,
	RunE: func(cmd *cobra.Command, args []string) error {
		env := viper.GetString("deploy.env")
		dryRun, _ := cmd.Flags().GetBool("dry-run")
		tag, _ := cmd.Flags().GetString("tag")
		timeout, _ := cmd.Flags().GetInt("timeout")

		if env == "" {
			return fmt.Errorf("--env is required (staging or production)")
		}

		if dryRun {
			color.Yellow("⚠ Dry run mode — no changes will be made")
		}

		fmt.Printf("%s Deploying to %s", color.BlueString("ℹ"), color.New(color.Bold).Sprint(env))
		if tag != "" {
			fmt.Printf(" (tag: %s)", tag)
		}
		fmt.Printf(" [timeout: %ds]\n", timeout)

		// ... deployment logic ...

		color.Green("✓ Deployed to %s", env)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(deployCmd)

	deployCmd.Flags().StringP("env", "e", "", "target environment (staging, production)")
	deployCmd.Flags().Bool("dry-run", false, "preview changes without deploying")
	deployCmd.Flags().String("tag", "", "deploy specific version tag")
	deployCmd.Flags().Int("timeout", 300, "deployment timeout in seconds")

	deployCmd.MarkFlagRequired("env")

	// Bind to viper for config file support
	viper.BindPFlag("deploy.env", deployCmd.Flags().Lookup("env"))
	viper.BindPFlag("deploy.timeout", deployCmd.Flags().Lookup("timeout"))
}
```

---

## Viper Configuration

```go
// internal/config/config.go
package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

type Config struct {
	Env      string        `mapstructure:"env"`
	Port     int           `mapstructure:"port"`
	Verbose  bool          `mapstructure:"verbose"`
	LogLevel string        `mapstructure:"log_level"`
	API      APIConfig     `mapstructure:"api"`
	Deploy   DeployConfig  `mapstructure:"deploy"`
}

type APIConfig struct {
	URL     string `mapstructure:"url"`
	Timeout int    `mapstructure:"timeout"`
}

type DeployConfig struct {
	Env     string `mapstructure:"env"`
	Timeout int    `mapstructure:"timeout"`
}

func Load() (*Config, error) {
	// Set defaults
	viper.SetDefault("env", "development")
	viper.SetDefault("port", 3000)
	viper.SetDefault("log_level", "info")
	viper.SetDefault("api.url", "https://api.example.com")
	viper.SetDefault("api.timeout", 30)
	viper.SetDefault("deploy.timeout", 300)

	// Config file locations (searched in order)
	home, _ := os.UserHomeDir()
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(filepath.Join(home, ".mycli"))  // ~/.mycli/config.yaml
	viper.AddConfigPath(".")                             // ./config.yaml

	// Environment variables: MYCLI_ENV, MYCLI_PORT, MYCLI_API_URL, etc.
	viper.SetEnvPrefix("MYCLI")
	viper.AutomaticEnv()

	// Read config file (ignore if not found)
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config: %w", err)
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("error parsing config: %w", err)
	}

	return &cfg, nil
}
```

Config file example (`~/.mycli/config.yaml`):

```yaml
env: development
port: 3000
log_level: info
api:
  url: https://api.example.com
  timeout: 30
deploy:
  env: staging
  timeout: 300
```

---

## Bubble Tea Interactive TUI

Bubble Tea is the Go framework for building interactive terminal UIs.

```bash
go get github.com/charmbracelet/bubbletea@latest
go get github.com/charmbracelet/lipgloss@latest
```

```go
package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	focusedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))
	normalStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
	checkStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("42"))
)

type model struct {
	choices  []string
	cursor   int
	selected map[int]struct{}
	done     bool
}

func initialModel() model {
	return model{
		choices: []string{
			"TypeScript",
			"ESLint",
			"Prettier",
			"Testing (Vitest)",
			"Docker",
			"CI/CD (GitHub Actions)",
		},
		selected: map[int]struct{}{
			0: {}, // TypeScript pre-selected
			1: {}, // ESLint pre-selected
		},
	}
}

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		case "up", "k":
			if m.cursor > 0 {
				m.cursor--
			}
		case "down", "j":
			if m.cursor < len(m.choices)-1 {
				m.cursor++
			}
		case " ":
			if _, ok := m.selected[m.cursor]; ok {
				delete(m.selected, m.cursor)
			} else {
				m.selected[m.cursor] = struct{}{}
			}
		case "enter":
			m.done = true
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m model) View() string {
	if m.done {
		s := checkStyle.Render("✓") + " Selected features:\n"
		for i, choice := range m.choices {
			if _, ok := m.selected[i]; ok {
				s += fmt.Sprintf("  %s %s\n", checkStyle.Render("•"), choice)
			}
		}
		return s
	}

	s := "Select features (space to toggle, enter to confirm):\n\n"

	for i, choice := range m.choices {
		cursor := "  "
		if m.cursor == i {
			cursor = focusedStyle.Render("▸ ")
		}

		checked := "○"
		style := normalStyle
		if _, ok := m.selected[i]; ok {
			checked = checkStyle.Render("●")
			style = lipgloss.NewStyle()
		}

		s += fmt.Sprintf("%s%s %s\n", cursor, checked, style.Render(choice))
	}

	s += "\n" + normalStyle.Render("↑/↓: navigate • space: toggle • enter: confirm • q: quit")
	return s
}

func main() {
	p := tea.NewProgram(initialModel())
	finalModel, err := p.Run()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	m := finalModel.(model)
	if !m.done {
		fmt.Println("\nCancelled.")
		os.Exit(130)
	}
}
```

---

## Progress Indicators

### Progress Bars

```bash
go get github.com/schollz/progressbar/v3@latest
```

```go
package main

import (
	"time"

	"github.com/schollz/progressbar/v3"
)

func main() {
	// Simple progress bar
	bar := progressbar.NewOptions(100,
		progressbar.OptionSetDescription("Downloading"),
		progressbar.OptionSetWidth(30),
		progressbar.OptionShowCount(),
		progressbar.OptionShowIts(),
		progressbar.OptionSetTheme(progressbar.Theme{
			Saucer:        "█",
			SaucerPadding: "░",
			BarStart:      "|",
			BarEnd:        "|",
		}),
	)

	for i := 0; i <= 100; i++ {
		bar.Add(1)
		time.Sleep(30 * time.Millisecond)
	}

	// Custom bar with bytes
	bar2 := progressbar.NewOptions64(1024*1024*100,
		progressbar.OptionSetDescription("Uploading"),
		progressbar.OptionSetWidth(30),
		progressbar.OptionShowBytes(true),
		progressbar.OptionShowElapsedTimeOnFinish(),
	)

	for i := 0; i < 100; i++ {
		bar2.Add(1024 * 1024)
		time.Sleep(20 * time.Millisecond)
	}
}
```

### Spinners

```bash
go get github.com/briandowns/spinner@latest
```

```go
package main

import (
	"fmt"
	"time"

	"github.com/briandowns/spinner"
	"github.com/fatih/color"
)

func main() {
	s := spinner.New(spinner.CharSets[14], 100*time.Millisecond)
	s.Color("cyan")

	// Step 1
	s.Suffix = " Installing dependencies..."
	s.Start()
	time.Sleep(2 * time.Second)
	s.Stop()
	color.Green("✓ Dependencies installed")

	// Step 2
	s.Suffix = " Building project..."
	s.Start()
	time.Sleep(2 * time.Second)
	s.Stop()
	color.Green("✓ Project built")

	// Step 3
	s.Suffix = " Running tests..."
	s.Start()
	time.Sleep(1 * time.Second)
	s.Stop()
	color.Green("✓ All tests passed")

	fmt.Println()
	color.New(color.FgGreen, color.Bold).Println("Done! Project is ready.")
}
```

---

## Colored Output

```bash
go get github.com/fatih/color@latest
```

```go
package main

import (
	"fmt"
	"os"

	"github.com/fatih/color"
)

func main() {
	// Basic colors
	color.Red("✗ Error: Something went wrong")
	color.Green("✓ Success")
	color.Yellow("⚠ Warning: Config file not found")
	color.Blue("ℹ Info: Using default settings")

	// Custom styles
	bold := color.New(color.Bold)
	dim := color.New(color.Faint)
	errorStyle := color.New(color.FgRed, color.Bold)
	successStyle := color.New(color.FgGreen, color.Bold)
	headerStyle := color.New(color.FgCyan, color.Bold, color.Underline)

	headerStyle.Println("Deployment Summary")
	fmt.Println()
	bold.Printf("  Environment: ")
	fmt.Println("production")
	bold.Printf("  Version:     ")
	fmt.Println("v2.1.0")
	bold.Printf("  Status:      ")
	successStyle.Println("healthy")
	dim.Println("  Deployed 2 minutes ago")

	// Conditional color (respects NO_COLOR env var)
	if os.Getenv("NO_COLOR") != "" || os.Getenv("CI") != "" {
		color.NoColor = true
	}

	// Sprint variants for inline use
	info := color.New(color.FgBlue).SprintFunc()
	success := color.New(color.FgGreen).SprintFunc()
	warn := color.New(color.FgYellow).SprintFunc()
	errMsg := color.New(color.FgRed).SprintFunc()

	fmt.Printf("%s Loading configuration...\n", info("ℹ"))
	fmt.Printf("%s Project created\n", success("✓"))
	fmt.Printf("%s Node 18+ recommended\n", warn("⚠"))
	fmt.Printf("%s Connection failed\n", errMsg("✗"))
}
```

---

## Error Handling

```go
// cmd/deploy.go
var deployCmd = &cobra.Command{
	Use:   "deploy",
	Short: "Deploy to target environment",
	RunE: func(cmd *cobra.Command, args []string) error {
		// RunE returns errors instead of calling os.Exit directly
		env, _ := cmd.Flags().GetString("env")
		if env == "" {
			return fmt.Errorf("--env is required (staging or production)")
		}

		if err := runDeploy(env); err != nil {
			return fmt.Errorf("deployment to %s failed: %w", env, err)
		}

		return nil
	},
}

// Error type switching
func handleError(err error) int {
	if err == nil {
		return 0
	}

	var permErr *os.PathError
	if errors.As(err, &permErr) && errors.Is(permErr.Err, os.ErrPermission) {
		color.Red("\n  ✗ Permission denied: %s", permErr.Path)
		fmt.Fprintf(os.Stderr, "  Try running with sudo or check file permissions.\n\n")
		return 77
	}

	if errors.Is(err, os.ErrNotExist) {
		color.Red("\n  ✗ File not found")
		fmt.Fprintf(os.Stderr, "  Make sure the path exists and is spelled correctly.\n\n")
		return 1
	}

	var netErr *net.OpError
	if errors.As(err, &netErr) {
		color.Red("\n  ✗ Network error: Could not connect to %s", netErr.Addr)
		fmt.Fprintf(os.Stderr, "  Check your internet connection and try again.\n\n")
		return 1
	}

	color.Red("\n  ✗ Error: %s", err)
	return 1
}

// SIGINT handling
func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	go func() {
		<-ctx.Done()
		fmt.Fprintf(os.Stderr, "\n\n  Operation cancelled.\n\n")
		os.Exit(130)
	}()

	Execute()
}
```

---

## Testing

```go
// cmd/init_test.go
package cmd

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func executeCommand(args ...string) (string, error) {
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)
	rootCmd.SetErr(buf)
	rootCmd.SetArgs(args)
	err := rootCmd.Execute()
	return buf.String(), err
}

func TestVersion(t *testing.T) {
	output, err := executeCommand("--version")
	require.NoError(t, err)
	assert.Contains(t, output, "mycli version")
}

func TestHelp(t *testing.T) {
	output, err := executeCommand("--help")
	require.NoError(t, err)
	assert.Contains(t, output, "init")
	assert.Contains(t, output, "deploy")
	assert.Contains(t, output, "config")
}

func TestInitCreatesProject(t *testing.T) {
	tmpDir := t.TempDir()
	origDir, _ := os.Getwd()
	defer os.Chdir(origDir)
	os.Chdir(tmpDir)

	output, err := executeCommand("init", "test-project", "--template", "default")
	require.NoError(t, err)
	assert.Contains(t, output, "test-project")
	assert.DirExists(t, filepath.Join(tmpDir, "test-project"))
}

func TestInitFailsOnExistingDir(t *testing.T) {
	tmpDir := t.TempDir()
	origDir, _ := os.Getwd()
	defer os.Chdir(origDir)
	os.Chdir(tmpDir)

	os.Mkdir("existing", 0755)
	_, err := executeCommand("init", "existing")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

func TestDeployRequiresEnv(t *testing.T) {
	_, err := executeCommand("deploy")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "--env")
}

func TestUnknownCommand(t *testing.T) {
	_, err := executeCommand("nonexistent")
	assert.Error(t, err)
}
```

---

## Build & Distribution

### Makefile

```makefile
APP_NAME := mycli
VERSION := $(shell git describe --tags --always --dirty)
BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS := -ldflags "-X main.version=$(VERSION) -X main.buildTime=$(BUILD_TIME) -s -w"

.PHONY: build test lint clean install release

build:
	go build $(LDFLAGS) -o bin/$(APP_NAME) .

test:
	go test ./... -v -race -coverprofile=coverage.out

lint:
	golangci-lint run ./...

clean:
	rm -rf bin/ dist/ coverage.out

install: build
	cp bin/$(APP_NAME) $(GOPATH)/bin/

# Cross-compilation
release: clean
	GOOS=darwin  GOARCH=amd64 go build $(LDFLAGS) -o dist/$(APP_NAME)-darwin-amd64 .
	GOOS=darwin  GOARCH=arm64 go build $(LDFLAGS) -o dist/$(APP_NAME)-darwin-arm64 .
	GOOS=linux   GOARCH=amd64 go build $(LDFLAGS) -o dist/$(APP_NAME)-linux-amd64 .
	GOOS=linux   GOARCH=arm64 go build $(LDFLAGS) -o dist/$(APP_NAME)-linux-arm64 .
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o dist/$(APP_NAME)-windows-amd64.exe .
```

### Version Injection

```go
// main.go
package main

var (
	version   = "dev"
	buildTime = "unknown"
)

func main() {
	rootCmd.Version = fmt.Sprintf("%s (built %s)", version, buildTime)
	Execute()
}
```

Build with version:

```bash
go build -ldflags "-X main.version=v1.2.0 -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o mycli .
```
