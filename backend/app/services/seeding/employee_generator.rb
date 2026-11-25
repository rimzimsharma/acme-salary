module Seeding
  # Deterministic synthetic workforce. The same seed and `today` always give the
  # same rows, so tests and demos are reproducible.
  class EmployeeGenerator
    include Enumerable

    COUNTRIES = {
      "United States"  => { currency: "USD", weight: 30 },
      "India"          => { currency: "INR", weight: 22 },
      "United Kingdom" => { currency: "GBP", weight: 12 },
      "Germany"        => { currency: "EUR", weight: 12 },
      "Canada"         => { currency: "CAD", weight: 8 },
      "Australia"      => { currency: "AUD", weight: 8 },
      "Japan"          => { currency: "JPY", weight: 8 }
    }.freeze

    DEPARTMENTS = {
      "Engineering" => { weight: 35, titles: ["Software Engineer", "QA Engineer", "DevOps Engineer", "Data Engineer"] },
      "Sales"       => { weight: 18, titles: ["Account Executive", "Sales Manager", "Sales Development Rep"] },
      "Marketing"   => { weight: 9,  titles: ["Marketing Specialist", "Content Strategist"] },
      "HR"          => { weight: 5,  titles: ["HR Generalist", "Recruiter"] },
      "Finance"     => { weight: 8,  titles: ["Accountant", "Financial Analyst"] },
      "Operations"  => { weight: 15, titles: ["Operations Analyst", "Support Specialist"] },
      "Product"     => { weight: 10, titles: ["Product Manager", "Designer"] }
    }.freeze

    SENIORITIES = { "junior" => 25, "mid" => 35, "senior" => 25, "lead" => 11, "executive" => 4 }.freeze

    FIRST_NAMES = %w[Aarav Priya Rohan Ananya Vikram Neha Arjun Kavya Liam Olivia Noah Emma Oliver Amelia
                     James Sophia Lucas Mia Ethan Chloe Hana Kenji Yuki Sakura Hiro Lena Jonas Greta Felix Marta
                     Mateo Sofia Daniel Grace Samuel Zoe Ravi Isha Tom Ella].freeze
    LAST_NAMES = %w[Sharma Patel Singh Rao Iyer Gupta Reddy Nair Smith Johnson Brown Taylor Wilson Clark Walker
                    Hall Young King Wright Scott Tanaka Sato Suzuki Watanabe Muller Schmidt Fischer Weber
                    Wagner Becker Martin Roy Tremblay Campbell Stewart Evans Hughes Morgan Cooper Reed Bailey].freeze

    def initialize(count:, seed: 42, today: Date.current)
      @count = count
      @seed = seed
      @today = today
    end

    def each
      return enum_for(:each) unless block_given?

      rng = Random.new(@seed)
      @count.times { |i| yield build_row(i, rng) }
    end

    private

    def build_row(index, rng)
      country = weighted(rng, COUNTRIES.transform_values { |c| c[:weight] })
      department = weighted(rng, DEPARTMENTS.transform_values { |d| d[:weight] })
      first = FIRST_NAMES.sample(random: rng)
      last = LAST_NAMES.sample(random: rng)

      {
        full_name: "#{first} #{last}",
        # The sequence number guarantees uniqueness at any scale.
        email: "#{first}.#{last}.#{index + 1}@acme.example".downcase,
        job_title: DEPARTMENTS.fetch(department)[:titles].sample(random: rng),
        department: department,
        country: country,
        currency: COUNTRIES.fetch(country)[:currency],
        annual_salary: 2_400_000,
        seniority: weighted(rng, SENIORITIES),
        hire_date: @today - rng.rand(0..(12 * 365)),
        active: true
      }
    end

    def weighted(rng, weights)
      roll = rng.rand(weights.values.sum)
      weights.each do |key, weight|
        return key if roll < weight
        roll -= weight
      end
    end
  end
end
