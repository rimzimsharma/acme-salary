require "test_helper"

class Seeding::EmployeeGeneratorTest < ActiveSupport::TestCase
  TODAY = Date.new(2026, 11, 25)

  def rows(count: 300, seed: 7)
    Seeding::EmployeeGenerator.new(count: count, seed: seed, today: TODAY).to_a
  end

  test "generates exactly the requested number of rows" do
    assert_equal 300, rows.size
    assert_equal 0, rows(count: 0).size
  end

  test "every generated row passes Employee validations" do
    # The seeder bulk-inserts without validations, so this is the safety net.
    invalid = rows.map { |attrs| Employee.new(attrs.except(:outlier)) }.reject(&:valid?)
    assert_empty invalid.map { |e| [ e.email, e.errors.full_messages ] }
  end

  test "same seed gives identical data; different seed differs" do
    assert_equal rows(seed: 1), rows(seed: 1)
    assert_not_equal rows(seed: 1), rows(seed: 2)
  end

  test "covers several countries, departments and all seniority levels" do
    data = rows(count: 2_000)
    assert_operator data.map { |r| r[:country] }.uniq.size, :>=, 5
    assert_operator data.map { |r| r[:department] }.uniq.size, :>=, 5
    assert_equal Employee::SENIORITIES.sort, data.map { |r| r[:seniority] }.uniq.sort
  end

  test "each country is paid in its own currency" do
    rows(count: 500).each do |r|
      assert_equal Seeding::EmployeeGenerator::COUNTRIES.fetch(r[:country])[:currency], r[:currency]
    end
  end

  test "emails are unique" do
    emails = rows(count: 2_000).map { |r| r[:email] }
    assert_equal emails.size, emails.uniq.size
  end

  test "hire dates are never in the future" do
    assert rows.all? { |r| r[:hire_date] <= TODAY }
  end

  def usd_average(data)
    data.sum { |r| CurrencyRates.to_usd(r[:annual_salary], r[:currency]) }.fdiv(data.size)
  end

  test "pay rises with seniority (compared in USD)" do
    data = rows(count: 6_000)
    by_level = data.group_by { |r| r[:seniority] }.transform_values { |g| usd_average(g) }
    ordered = Employee::SENIORITIES.map { |level| by_level.fetch(level) }
    ordered.each_cons(2) { |lower, higher| assert_operator lower, :<, higher, "pay should strictly rise with seniority: #{by_level}" }
  end

  test "the same role pays less in lower-cost countries (USD terms)" do
    data = rows(count: 6_000)
    us = usd_average(data.select { |r| r[:country] == "United States" })
    india = usd_average(data.select { |r| r[:country] == "India" })
    assert_in_delta 0.25, india / us, 0.05 # India pay band is 25% of the US band
  end

  test "salaries are rounded to a realistic step, not odd numbers" do
    rows(count: 200).each { |r| assert_equal 0, r[:annual_salary] % 500, "#{r[:currency]} #{r[:annual_salary]}" }
  end

  test "most staff are active but some have left" do
    data = rows(count: 3_000)
    share = data.count { |r| r[:active] }.fdiv(data.size)
    assert_in_delta 0.94, share, 0.03
  end

  test "a small share of deliberate pay outliers exists for the insights to find" do
    data = rows(count: 5_000)
    flagged = data.select { |r| r[:outlier] }
    assert_in_delta 0.01, flagged.size.fdiv(data.size), 0.006
    assert flagged.all? { |r| r.key?(:annual_salary) }
  end

  test "outliers really are far from the band for their peers" do
    data = rows(count: 8_000)
    peers = data.reject { |r| r[:outlier] }.group_by { |r| [ r[:country], r[:job_title], r[:seniority] ] }
    far = data.select { |r| r[:outlier] }.count do |r|
      group = peers[[ r[:country], r[:job_title], r[:seniority] ]]
      next false if group.blank?
      median = group.map { |p| p[:annual_salary] }.sort[group.size / 2]
      ratio = r[:annual_salary].fdiv(median)
      ratio < 0.65 || ratio > 1.5
    end
    assert_operator far, :>=, 40
  end
end
