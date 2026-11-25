require "test_helper"

class Insights::SummaryTest < ActiveSupport::TestCase
  test "counts active employees and totals their payroll in USD" do
    create_employee(country: "India", currency: "INR", annual_salary: 8_300_000) # 100,000 USD
    create_employee(country: "United States", currency: "USD", annual_salary: 200_000)
    summary = Insights::Summary.call
    assert_equal 2, summary[:headcount]
    assert_equal 300_000, summary[:total_payroll_usd]
  end

  test "reports min, median, avg and max pay in USD" do
    create_employee(country: "India", currency: "INR", annual_salary: 8_300_000)
    create_employee(country: "United States", currency: "USD", annual_salary: 200_000)
    assert_equal({ min: 100_000, median: 150_000, avg: 150_000, max: 200_000 }, Insights::Summary.call[:usd])
  end

  test "also reports distinct countries and how many people have left" do
    create_employee(country: "India")
    create_employee(country: "India")
    create_employee(country: "Japan", currency: "JPY")
    create_employee(country: "India").deactivate!
    summary = Insights::Summary.call
    assert_equal 2, summary[:countries]
    assert_equal 1, summary[:inactive_count]
    assert_equal 3, summary[:headcount] # the leaver is not counted as headcount
  end
end
