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

  test "rounds to the nearest dollar rather than truncating" do
    assert_equal 1, CurrencyRates.to_usd(100, "INR") # 1.20 -> 1
    assert_equal 2, CurrencyRates.to_usd(125, "INR") # 1.51 -> 2 (a floor would give 1)
  end
end
