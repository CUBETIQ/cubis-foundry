# Testing and RSpec Patterns

## RSpec Structure

```ruby
# spec/services/create_order_spec.rb
RSpec.describe CreateOrder do
  subject(:service) { described_class.new(order_repo:, pricing:, notifier:) }

  let(:order_repo) { instance_double(OrderRepository) }
  let(:pricing) { instance_double(PricingService) }
  let(:notifier) { instance_double(EmailNotifier) }

  before do
    allow(order_repo).to receive(:save)
    allow(notifier).to receive(:order_created)
  end

  describe "#call" do
    context "with valid items" do
      let(:items) { [build(:line_item, quantity: 2)] }

      before do
        allow(pricing).to receive(:calculate).and_return(Money.new(amount: 1999, currency: "USD"))
      end

      it "creates an order" do
        result = service.call(customer: build(:user), items:)

        expect(result).to be_success
        expect(result.value).to be_a(Order)
        expect(result.value.total.amount).to eq(1999)
      end

      it "saves to repository" do
        service.call(customer: build(:user), items:)
        expect(order_repo).to have_received(:save).once
      end

      it "notifies customer" do
        service.call(customer: build(:user), items:)
        expect(notifier).to have_received(:order_created).once
      end
    end

    context "with empty items" do
      it "returns failure" do
        result = service.call(customer: build(:user), items: [])
        expect(result).to be_failure
        expect(result.error).to include("empty")
      end
    end
  end
end
```

## Shared Examples

```ruby
# spec/support/shared_examples/authenticatable.rb
RSpec.shared_examples "authenticatable" do
  describe "#authenticate" do
    it "returns true for correct password" do
      subject.password = "secret123"
      expect(subject.authenticate("secret123")).to be true
    end

    it "returns false for wrong password" do
      subject.password = "secret123"
      expect(subject.authenticate("wrong")).to be false
    end
  end
end

# Usage in specs
RSpec.describe User do
  subject { build(:user) }
  it_behaves_like "authenticatable"
end

RSpec.describe AdminUser do
  subject { build(:admin_user) }
  it_behaves_like "authenticatable"
end
```

## Request Specs (API Testing)

```ruby
RSpec.describe "Orders API", type: :request do
  let(:user) { create(:user) }
  let(:headers) { { "Authorization" => "Bearer #{user.auth_token}" } }

  describe "POST /api/orders" do
    let(:valid_params) do
      {
        order: {
          items: [{ product_id: create(:product).id, quantity: 2 }],
        },
      }
    end

    context "with valid params" do
      it "creates order and returns 201" do
        post "/api/orders", params: valid_params, headers:, as: :json

        expect(response).to have_http_status(:created)
        expect(json_response["order"]["id"]).to be_present
        expect(Order.count).to eq(1)
      end
    end

    context "without auth" do
      it "returns 401" do
        post "/api/orders", params: valid_params, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with invalid params" do
      it "returns 422 with errors" do
        post "/api/orders", params: { order: { items: [] } }, headers:, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to include("items")
      end
    end
  end
end

# Helper
def json_response
  JSON.parse(response.body)
end
```

## FactoryBot Strategies

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name { Faker::Name.name }
    role { :viewer }
    password { "password123" }

    trait :admin do
      role { :admin }
    end

    trait :with_orders do
      transient do
        order_count { 3 }
      end

      after(:create) do |user, evaluator|
        create_list(:order, evaluator.order_count, customer: user)
      end
    end
  end
end

# Usage
build(:user)                          # in-memory, no DB
create(:user, :admin)                 # persisted admin
create(:user, :with_orders, order_count: 5)  # with associated orders
attributes_for(:user)                 # hash of attributes
```

## Test Doubles

```ruby
# instance_double — verifies methods exist on the real class
repo = instance_double(OrderRepository)
allow(repo).to receive(:find_by_id).with(1).and_return(order)
allow(repo).to receive(:save).and_return(true)

# class_double
api_class = class_double(ExternalApi, fetch: response)

# spy — record calls, verify after
notifier = spy("notifier")
service.call(notifier:)
expect(notifier).to have_received(:notify).with(hash_including(type: :order_created))

# Stub chain
allow(User).to receive_message_chain(:active, :where, :order).and_return(users)
# Prefer extracting a query object over long stub chains
```

## SimpleCov Configuration

```ruby
# spec/spec_helper.rb (must be at the very top)
require "simplecov"

SimpleCov.start do
  add_filter "/spec/"
  add_filter "/config/"
  add_filter "/vendor/"

  add_group "Services", "app/services"
  add_group "Models", "app/models"
  add_group "Controllers", "app/controllers"

  minimum_coverage 80
  minimum_coverage_by_file 50
end

# CI integration
if ENV["CI"]
  require "simplecov-cobertura"
  SimpleCov.formatter = SimpleCov::Formatter::CoberturaFormatter
end
```

## CI Test Pipeline

```bash
# Gemfile
group :test do
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"
  gem "simplecov"
  gem "webmock"        # stub external HTTP
  gem "vcr"            # record/replay HTTP
  gem "rubocop-rspec"  # RSpec-specific linting
end

# CI script
bundle exec rubocop --parallel           # lint
bundle exec rspec --format documentation # tests
bundle audit check                       # vulnerability scan
```
