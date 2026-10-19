import Candidate, { STAGES, SOURCES } from './models/Candidate.js';

const FIRST = ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Kavya', 'Liam', 'Emma', 'Noah', 'Olivia', 'Mateo', 'Sofia', 'Yuki', 'Chen', 'Fatima', 'Omar', 'Zara', 'Ethan', 'Isha', 'Kabir', 'Maya', 'Leo'];
const LAST = ['Sharma', 'Patel', 'Gupta', 'Iyer', 'Reddy', 'Khan', 'Smith', 'Garcia', 'Nguyen', 'Kim', 'Müller', 'Rossi', 'Silva', 'Tanaka', 'Singh', 'Brown'];
const ROLES = {
  'Frontend Engineer': ['React', 'TypeScript', 'CSS', 'Next.js', 'Redux', 'Testing Library'],
  'Backend Engineer': ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Docker', 'Redis'],
  'Full Stack Developer': ['React', 'Node.js', 'MongoDB', 'Express', 'AWS', 'GraphQL'],
  'Product Designer': ['Figma', 'Prototyping', 'User Research', 'Design Systems'],
  'Data Analyst': ['SQL', 'Python', 'Tableau', 'Excel', 'Statistics'],
  'DevOps Engineer': ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Linux', 'Docker'],
};
const CITIES = ['Bengaluru', 'Pune', 'Delhi', 'Mumbai', 'Hyderabad', 'Remote', 'London', 'Berlin', 'Singapore'];
const NOTES = ['Strong communication skills.', 'Solid system design answers.', 'Needs to improve on testing.', 'Great culture fit.', 'Asked about remote policy.', 'Portfolio is impressive.', 'Salary expectations slightly above band.'];

// Deterministic PRNG so seeds are reproducible
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

export async function seedCandidates(count = 60) {
  const rand = rng(42);
  const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];
  const DAY = 864e5;
  const now = Date.now();
  const docs = [];
  const used = new Set();

  for (let i = 0; i < count; i++) {
    const first = pickOne(FIRST);
    const last = pickOne(LAST);
    let email = `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[^\w.]/g, '') + '@example.com';
    if (used.has(email)) email = email.replace('@', `${i}@`);
    used.add(email);

    const position = pickOne(Object.keys(ROLES));
    const skills = ROLES[position].filter(() => rand() > 0.4);
    const appliedAt = new Date(now - Math.floor(rand() * 70) * DAY - Math.floor(rand() * DAY));

    // Walk the pipeline a random number of steps, possibly ending in rejection
    const pipeline = STAGES.filter((s) => s !== 'Rejected');
    const steps = Math.floor(rand() ** 1.6 * pipeline.length);
    const history = [{ from: null, to: 'Applied', changedAt: appliedAt }];
    let t = appliedAt.getTime();
    let stage = 'Applied';
    for (let s = 1; s <= steps; s++) {
      t = Math.min(now, t + (2 + Math.floor(rand() * 8)) * DAY);
      history.push({ from: stage, to: pipeline[s], changedAt: new Date(t) });
      stage = pipeline[s];
    }
    if (stage !== 'Hired' && rand() < 0.22) {
      t = Math.min(now, t + (1 + Math.floor(rand() * 5)) * DAY);
      history.push({ from: stage, to: 'Rejected', changedAt: new Date(t) });
      stage = 'Rejected';
    }

    docs.push({
      name: `${first} ${last}`,
      email,
      phone: `+91 9${String(Math.floor(rand() * 1e9)).padStart(9, '0')}`,
      position,
      location: pickOne(CITIES),
      experience: Math.floor(rand() * 12),
      skills: skills.length ? skills : ROLES[position].slice(0, 2),
      source: pickOne(SOURCES),
      stage,
      rating: stage === 'Applied' ? 0 : 1 + Math.floor(rand() * 5),
      appliedAt,
      stageHistory: history,
      notes: rand() > 0.5 ? [{ text: pickOne(NOTES), author: 'Recruiter', createdAt: new Date(t) }] : [],
    });
  }

  await Candidate.deleteMany({});
  await Candidate.insertMany(docs);
  return docs.length;
}
