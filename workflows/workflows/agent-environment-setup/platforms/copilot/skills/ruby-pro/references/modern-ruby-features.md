# Modern Ruby Features

## Pattern Matching (Ruby 3.0+)

```ruby
# case/in pattern matching
case response
in { status: 200, body: { data: Array => items } }
  process_items(items)
in { status: 200, body: { data: Hash => item } }
  process_item(item)
in { status: 404 }
  raise NotFoundError
in { status: (500..) }
  raise ServerError, "Status: #{response[:status]}"
end

# Find pattern (Ruby 3.0) — match element in array
case users
in [*, { role: "admin", name: String => admin_name }, *]
  puts "Found admin: #{admin_name}"
end

# Pin operator — match against existing variable
expected_status = 200
case response
in { status: ^expected_status }
  puts "OK"
end

# Rightward assignment with pattern
response => { status:, body: { data: } }
# status and data are now local variables

# Guard clauses
case user
in { age: (18..) => age } if age < 65
  puts "Working age: #{age}"
end
```

## Data.define (Ruby 3.2+)

```ruby
# Immutable value objects — replacement for Struct
Point = Data.define(:x, :y)
point = Point.new(x: 1, y: 2)
point.x      # => 1
point.frozen? # => true
# point.x = 3 # NoMethodError — immutable

# With custom methods
Money = Data.define(:amount, :currency) do
  def to_s = "#{format('%.2f', amount / 100.0)} #{currency}"

  def +(other)
    raise ArgumentError, "Currency mismatch" unless currency == other.currency
    Money.new(amount: amount + other.amount, currency: currency)
  end
end

price = Money.new(amount: 1999, currency: "USD")
tax = Money.new(amount: 160, currency: "USD")
total = price + tax  # Money(amount: 2159, currency: "USD")

# Pattern matching with Data
case point
in Point[x: 0, y: 0]
  "origin"
in Point[x: 0, y:]
  "on y-axis at #{y}"
in Point[x:, y: 0]
  "on x-axis at #{x}"
in Point[x:, y:]
  "(#{x}, #{y})"
end
```

## Numbered Block Parameters (Ruby 2.7+)

```ruby
# _1, _2, etc. for simple blocks
[1, 2, 3].map { _1 * 2 }          # => [2, 4, 6]
{ a: 1, b: 2 }.map { "#{_1}=#{_2}" } # => ["a=1", "b=2"]

# Best for simple one-liners; use named params for complex blocks
users.select { _1.active? && _1.age >= 18 }
```

## Endless Method Definition (Ruby 3.0+)

```ruby
# Single-expression methods without end
def full_name = "#{first_name} #{last_name}"
def adult? = age >= 18
def area = Math::PI * radius**2

# With arguments
def greet(name) = "Hello, #{name}!"
```

## Hash Shorthand (Ruby 3.1+)

```ruby
# Omit value when key and variable name match
name = "Alice"
age = 30
role = :admin

# Before
user = { name: name, age: age, role: role }

# After — shorthand
user = { name:, age:, role: }
```

## Enumerator::Product and Composable Enumerators

```ruby
# Enumerator.product (Ruby 3.2+)
colors = [:red, :blue]
sizes = [:s, :m, :l]
Enumerator::Product.new(colors, sizes).each do |color, size|
  puts "#{color}-#{size}" # red-s, red-m, red-l, blue-s, blue-m, blue-l
end

# Lazy enumerators for large/infinite sequences
(1..).lazy
  .select { _1.odd? }
  .map { _1 ** 2 }
  .first(5)  # => [1, 9, 25, 49, 81]
```

## Frozen String Literals

```ruby
# frozen_string_literal: true

# All string literals are frozen (immutable) — less GC pressure
greeting = "hello"
greeting << " world" # FrozenError raised

# Explicit mutable strings
mutable = String.new("hello")
mutable << " world"  # OK

# Or duplicate
mutable = "hello".dup
mutable << " world"  # OK
```

## Refinements

```ruby
# Safe monkey-patching — scoped to file/module
module StringExtensions
  refine String do
    def to_slug
      downcase.strip.gsub(/\s+/, '-').gsub(/[^\w-]/, '')
    end
  end
end

# Only active where explicitly used
using StringExtensions
"Hello World!".to_slug # => "hello-world"
# Outside this file, String#to_slug doesn't exist
```

## Error Handling Improvements

```ruby
# Exception#detailed_message (Ruby 3.2+)
class ApiError < StandardError
  def initialize(status, body)
    @status = status
    @body = body
    super("API error: #{status}")
  end

  def detailed_message(highlight: false, **)
    msg = "API Error #{@status}: #{@body.first(200)}"
    highlight ? "\e[1;31m#{msg}\e[0m" : msg
  end
end

# Syntax sugar for rescue in blocks
result = Integer("abc") rescue nil  # inline rescue (use sparingly)
```
