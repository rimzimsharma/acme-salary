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
    invalid = rows.map { |attrs| Employee.new(attrs) }.reject(&:valid?)
    assert_empty invalid.map { |e| [e.email, e.errors.full_messages] }
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
end
