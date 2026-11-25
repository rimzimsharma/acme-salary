require "test_helper"

class Seeding::EmployeeSeederTest < ActiveSupport::TestCase
  test "inserts the requested number of employees" do
    Seeding::EmployeeSeeder.call(count: 120, batch_size: 50)
    assert_equal 120, Employee.count
  end

  test "re-running replaces the data instead of duplicating it" do
    2.times { Seeding::EmployeeSeeder.call(count: 40) }
    assert_equal 40, Employee.count
  end

  test "inserted rows are stored the way the model expects" do
    Seeding::EmployeeSeeder.call(count: 30)
    assert Employee.all.all?(&:valid?)
    assert_operator Employee.active.count, :>, 0
  end
end
