# Object Design Patterns

## Service Objects

```ruby
# Single-purpose service with call interface
class CreateOrder
  def initialize(order_repo:, pricing:, notifier:)
    @order_repo = order_repo
    @pricing = pricing
    @notifier = notifier
  end

  def call(customer:, items:)
    total = @pricing.calculate(items)
    order = Order.new(customer:, items:, total:)

    @order_repo.save(order)
    @notifier.order_created(order)

    Result.success(order)
  rescue Pricing::Error => e
    Result.failure(e.message)
  end
end

# Usage
result = CreateOrder.new(
  order_repo: OrderRepository.new,
  pricing: PricingService.new,
  notifier: EmailNotifier.new,
).call(customer: current_user, items: cart_items)

case result
in Result[success: true, value: order]
  render json: order, status: :created
in Result[success: false, error: message]
  render json: { error: message }, status: :unprocessable_entity
end
```

## Value Objects with Data.define

```ruby
Email = Data.define(:address) do
  def initialize(address:)
    raise ArgumentError, "Invalid email" unless address.match?(/\A[^@]+@[^@]+\z/)
    super(address: address.downcase.strip)
  end

  def domain = address.split("@").last
  def to_s = address
end

DateRange = Data.define(:start_date, :end_date) do
  def initialize(start_date:, end_date:)
    raise ArgumentError, "Start must be before end" if start_date > end_date
    super
  end

  def days = (end_date - start_date).to_i
  def include?(date) = (start_date..end_date).cover?(date)
end
```

## Result Monad

```ruby
# Simple Result type for expected failures
class Result
  attr_reader :value, :error

  def initialize(success:, value: nil, error: nil)
    @success = success
    @value = value
    @error = error
    freeze
  end

  def self.success(value) = new(success: true, value:)
  def self.failure(error) = new(success: false, error:)

  def success? = @success
  def failure? = !@success

  def map
    return self if failure?
    Result.success(yield(value))
  end

  def flat_map
    return self if failure?
    yield(value)
  end

  # Pattern matching support
  def deconstruct_keys(keys)
    { success: @success, value: @value, error: @error }
  end
end

# Chainable operations
result = validate_input(params)
  .flat_map { |input| find_user(input[:user_id]) }
  .flat_map { |user| authorize(user, :create_order) }
  .flat_map { |user| create_order(user, params[:items]) }
  .map { |order| OrderSerializer.new(order).as_json }
```

## Query Objects

```ruby
# Encapsulate complex database queries
class ActiveOrdersQuery
  def initialize(scope = Order.all)
    @scope = scope
  end

  def call(filters = {})
    result = @scope.where(status: :active)

    result = result.where(customer_id: filters[:customer_id]) if filters[:customer_id]
    result = result.where("total >= ?", filters[:min_total]) if filters[:min_total]
    result = result.where("created_at >= ?", filters[:since]) if filters[:since]
    result = result.order(created_at: :desc)

    result
  end
end

# Usage
orders = ActiveOrdersQuery.new.call(
  customer_id: 42,
  min_total: 100,
  since: 30.days.ago,
)
```

## Composition Over Inheritance

```ruby
# BAD — deep inheritance
class AdminUser < PremiumUser < User < BaseModel

# GOOD — modules for shared behavior
module Authenticatable
  def authenticate(password)
    BCrypt::Password.new(password_digest) == password
  end
end

module Auditable
  def self.included(base)
    base.before_save :record_audit_trail
  end

  private

  def record_audit_trail
    AuditLog.record(self, changes)
  end
end

class User
  include Authenticatable
  include Auditable

  # User-specific behavior
end
```

## Decorator Pattern

```ruby
# SimpleDelegator for transparent decoration
class LoggingOrderService < SimpleDelegator
  def initialize(service, logger:)
    super(service)
    @logger = logger
  end

  def create(params)
    @logger.info("Creating order: #{params.inspect}")
    result = super
    @logger.info("Order created: #{result.value&.id}")
    result
  end
end

# Wrap the real service
service = LoggingOrderService.new(
  CreateOrder.new(order_repo:, pricing:, notifier:),
  logger: Rails.logger,
)
```

## Policy Objects

```ruby
# Encapsulate authorization logic
class OrderPolicy
  def initialize(user, order)
    @user = user
    @order = order
  end

  def show? = owner? || admin?
  def update? = owner? && @order.pending?
  def cancel? = (owner? || admin?) && @order.cancellable?
  def refund? = admin? && @order.paid?

  private

  def owner? = @user.id == @order.customer_id
  def admin? = @user.admin?
end

# Usage
raise Forbidden unless OrderPolicy.new(current_user, order).cancel?
```
