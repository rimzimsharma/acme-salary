# Fixed reference rates (local currency units per 1 USD). Deliberately static:
# live rates would add a network dependency and make insights non-deterministic.
module CurrencyRates
  PER_USD = {
    "USD" => 1.0, "EUR" => 0.92, "GBP" => 0.79, "INR" => 83.0,
    "CAD" => 1.36, "AUD" => 1.52, "JPY" => 150.0
  }.freeze

  def self.to_usd(amount, currency)
    (amount / PER_USD.fetch(currency)).round
  end
end
