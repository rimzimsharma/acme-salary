require "test_helper"

class CurrencyRatesTest < ActiveSupport::TestCase
  test "USD converts to itself" do
    assert_equal 50_000, CurrencyRates.to_usd(50_000, "USD")
  end

  test "converts using fixed reference rates, rounded to whole dollars" do
    assert_equal 1_000, CurrencyRates.to_usd(83_000, "INR") # 83 INR per USD
  end

  test "unknown currency raises rather than guessing" do
    assert_raises(KeyError) { CurrencyRates.to_usd(1, "XYZ") }
  end

  test "every currency an employee can have has a reference rate" do
    assert_empty Employee::CURRENCIES - CurrencyRates::PER_USD.keys
  end
end
