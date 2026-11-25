require "test_helper"

class Insights::SummaryTest < ActiveSupport::TestCase
  test "counts active employees and totals their payroll in USD" do
    create_employee(country: "India", currency: "INR", annual_salary: 8_300_000) # 100,000 USD
    create_employee(country: "United States", currency: "USD", annual_salary: 200_000)
    summary = Insights::Summary.call
    assert_equal 2, summary[:headcount]
    assert_equal 300_000, summary[:total_payroll_usd]
  end
end
