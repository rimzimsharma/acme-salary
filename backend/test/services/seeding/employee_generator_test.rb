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
end
