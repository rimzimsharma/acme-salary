require "test_helper"

class Insights::BreakdownTest < ActiveSupport::TestCase
  def breakdown(by, filters = {})
    Insights::Breakdown.call(by: by, filters: filters)
  end

  def row(rows, key) = rows.find { |r| r[:key] == key }

  test "counts headcount per group" do
    2.times { create_employee(country: "India") }
    create_employee(country: "Japan", currency: "JPY")
    rows = breakdown("country")
    assert_equal 2, row(rows, "India")[:headcount]
    assert_equal 1, row(rows, "Japan")[:headcount]
  end

  test "reports min, median, avg, max and total in USD using the reference rates" do
    create_employee(country: "India", currency: "INR", annual_salary: 8_300_000) # 100,000 USD
    create_employee(country: "India", currency: "INR", annual_salary: 4_150_000) #  50,000 USD
    usd = row(breakdown("country"), "India")[:usd]
    assert_equal({ min: 50_000, median: 75_000, avg: 75_000, max: 100_000, total: 150_000 }, usd)
  end

  test "USD figures compare pay across currencies in one group" do
    create_employee(department: "Sales", country: "India", currency: "INR", annual_salary: 8_300_000)
    create_employee(department: "Sales", country: "United States", currency: "USD", annual_salary: 120_000)
    usd = row(breakdown("department"), "Sales")[:usd]
    assert_equal [ 100_000, 120_000, 220_000 ], [ usd[:min], usd[:max], usd[:total] ]
  end

  test "people who have left are excluded from every figure" do
    create_employee(country: "India", annual_salary: 8_300_000)
    create_employee(country: "India", annual_salary: 83_000_000).deactivate!
    india = row(breakdown("country"), "India")
    assert_equal [ 1, 100_000 ], [ india[:headcount], india[:usd][:max] ]
  end

  test "only whitelisted grouping columns are accepted" do
    assert_raises(ArgumentError) { breakdown("email") }
    assert_raises(ArgumentError) { breakdown("country; DROP TABLE employees") }
    assert_raises(ArgumentError) { breakdown(nil) }
  end

  test "filters narrow the population so the UI can drill down" do
    create_employee(country: "India", job_title: "Recruiter", department: "HR")
    create_employee(country: "India", job_title: "Accountant", department: "Finance")
    create_employee(country: "Japan", currency: "JPY", job_title: "Recruiter", department: "HR")
    rows = breakdown("job_title", country: "India")
    assert_equal %w[Accountant Recruiter], rows.map { |r| r[:key] }.sort
    assert_equal [ 1, 1 ], rows.map { |r| r[:headcount] }
    assert_equal 1, row(breakdown("job_title", country: "India", department: "HR"), "Recruiter")[:headcount]
  end

  test "blank and unknown filters are ignored" do
    create_employee
    assert_equal 1, breakdown("country", country: "", bogus: "x").sum { |r| r[:headcount] }
  end

  test "single-currency groups also report figures in local currency; mixed groups do not" do
    create_employee(department: "Sales", country: "India", currency: "INR", annual_salary: 2_000_000)
    create_employee(department: "Sales", country: "India", currency: "INR", annual_salary: 3_000_000)
    create_employee(department: "HR", country: "India", currency: "INR", annual_salary: 1_000_000)
    create_employee(department: "HR", country: "United States", currency: "USD", annual_salary: 90_000)
    rows = breakdown("department")
    assert_equal({ currency: "INR", min: 2_000_000, median: 2_500_000, avg: 2_500_000, max: 3_000_000 }, row(rows, "Sales")[:local])
    assert_nil row(rows, "HR")[:local]
  end

  test "groups are ordered by headcount, largest first, then by name" do
    3.times { create_employee(country: "Japan", currency: "JPY") }
    create_employee(country: "India")
    create_employee(country: "Canada", currency: "CAD")
    assert_equal %w[Japan Canada India], breakdown("country").map { |r| r[:key] }
  end
end
