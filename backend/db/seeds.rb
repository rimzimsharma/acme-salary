# Seeds a deterministic synthetic workforce (default 10,000 employees).
#   bin/rails db:seed                      # 10,000 employees
#   EMPLOYEE_COUNT=500 bin/rails db:seed   # smaller data set
# Re-running replaces existing employees.
count = ENV.fetch("EMPLOYEE_COUNT", 10_000).to_i
started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
Seeding::EmployeeSeeder.call(count: count)
elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
puts "Seeded #{Employee.count} employees (#{Employee.active.count} active) in #{elapsed.round(2)}s"
