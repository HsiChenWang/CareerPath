import { db, peopleTable, conversationsTable, messagesTable, chatsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./passwords";
import { logger } from "./logger";

const names = [
  "Priya Shah", "Daniel Park", "Maya Patel", "Ethan Chen", "Sofia Martinez", "Jordan Williams", "Olivia Nguyen", "Ryan Kapoor", "Emma Thompson",
  "James Lee", "Isabella Rossi", "Michael Brooks", "Ava Johnson", "Noah Wilson", "Grace Liu", "Benjamin Cohen", "Zoe Davis", "Lucas Rivera",
  "Charlotte Kim", "William Taylor", "Amelia Garcia", "Henry Zhang", "Harper Scott", "Alexander Wu", "Evelyn Brown", "Sebastian Diaz", "Aria Mehta",
  "Nathan Tran", "Chloe Anderson", "Leo Nakamura", "Lily Robinson", "Owen Singh", "Ella Wang", "Jack Morgan", "Nora Ahmed", "Samuel Chang",
  "Victoria Chen", "Gabriel Santos", "Scarlett Lewis", "David Kim", "Penelope Allen", "Julian Park", "Layla Thomas", "Anthony Patel", "Stella Moore",
  "Marcus Reed", "Rachel Lin", "Aisha Rahman", "Tyler Bennett", "Camila Torres", "Kevin Huang", "Natalie Price", "Andre Robinson", "Vivian Choi", "Dylan Murphy", "Leila Hassan", "Eric Sun", "Sienna Flores", "Adrian Cho", "Fatima Ali",
];
const clusters = [
  { role: "Product Manager", company: "Google", school: "Viterbi", major: "Computer Science", outcome: "Product management", clubs: ["HackSC", "LavaLab"], skills: ["Python", "SQL", "Product strategy", "User research"], courses: ["CSCI 104: Data Structures", "CSCI 201: Software Development", "ITP 466: Business and Data Analytics"], internship: "Product internship at Microsoft", first: "Associate Product Manager at Google" },
  { role: "Investment Banking Analyst", company: "Goldman Sachs", school: "Marshall", major: "Business Administration", outcome: "Finance", clubs: ["Trojan Investing Society", "USC Finance Club"], skills: ["Financial modeling", "Excel", "Valuation", "Pitch decks"], courses: ["BUAD 306: Business Finance", "FBE 400: Advanced Finance", "ACCT 410: Financial Accounting"], internship: "Summer analyst at JPMorgan Chase", first: "Investment Banking Analyst at Goldman Sachs" },
  { role: "Consultant", company: "McKinsey", school: "Marshall", major: "Business Administration", outcome: "Consulting", clubs: ["Trojan Consulting Group", "USC Global Consulting"], skills: ["Market research", "Excel", "Case interviews", "Strategy"], courses: ["BUAD 304: Organizational Behavior", "BUAD 425: Data Analysis", "ECON 351: Microeconomics"], internship: "Strategy internship at Deloitte", first: "Business Analyst at McKinsey" },
  { role: "Software Engineer", company: "Apple", school: "Viterbi", major: "Computer Science", outcome: "Software engineering", clubs: ["HackSC", "USC ACM"], skills: ["Python", "C++", "Swift", "Data structures"], courses: ["CSCI 104: Data Structures", "CSCI 201: Software Development", "CSCI 350: Operating Systems"], internship: "Software engineering internship at Adobe", first: "Software Engineer at Apple" },
  { role: "Marketing Strategist", company: "Disney", school: "Annenberg", major: "Communication", outcome: "Marketing", clubs: ["USC American Marketing Association", "Annenberg Media"], skills: ["Content strategy", "Audience research", "Analytics", "Storytelling"], courses: ["COMM 200: Communication", "MKT 405: Advertising", "PR 463: Strategic Planning"], internship: "Brand marketing internship at Warner Bros.", first: "Marketing Associate at Disney" },
];
const varied = [
  ["Startup Founder", "Gather", "Viterbi", "Computer Science", "Entrepreneurship"],
  ["AI Hardware Engineer", "NVIDIA", "Viterbi", "Computer Engineering", "AI hardware"],
  ["Research Scientist", "NASA JPL", "Viterbi", "Computer Science", "Research"],
  ["Creative Technologist", "Walt Disney Imagineering", "Cinematic Arts", "Media Arts and Practice", "Creative technology"],
  ["Game Developer", "Riot Games", "Viterbi", "Computer Science (Games)", "Games"],
  ["Program Director", "Code.org", "Dornsife", "Sociology", "Nonprofit"],
  ["UX Researcher", "Figma", "Dornsife", "Cognitive Science", "Design"],
  ["Education Technologist", "Khan Academy", "Rossier", "Learning Design", "Education"],
  ["Climate Data Scientist", "Watershed", "Dornsife", "Environmental Studies", "Climate"],
  ["Film Producer", "A24", "Cinematic Arts", "Film and Television Production", "Film"],
  ["Music Technology Lead", "Spotify", "Thornton", "Music Technology", "Music"],
  ["Robotics Engineer", "Boston Dynamics", "Viterbi", "Mechanical Engineering", "Robotics"],
  ["Founder", "Mosaic Health", "Viterbi", "Computer Science", "Entrepreneurship"],
  ["Research Fellow", "Stanford University", "Dornsife", "Neuroscience", "Research"],
  ["Product Designer", "Duolingo", "Annenberg", "Communication", "Design"],
];
function availability(index: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 2 + i * 3);
    d.setUTCHours(18 + index % 3, 0, 0, 0);
    return d.toISOString();
  });
}
export async function seedCareerPath() {
  const existing = await db.select({ id: peopleTable.id }).from(peopleTable).where(eq(peopleTable.id, "alex"));
  if (existing.length) return;
  const demoHash = await hashPassword("Trojan2026!");
  const alumni = names.map((name, i) => {
    const c = clusters[Math.min(4, Math.floor(i / 9))]!;
    const v = i >= 45 ? varied[i - 45]! : null;
    const role = v ? v[0]! : c.role;
    const company = v ? v[1]! : c.company;
    const school = v ? v[2]! : (i % 9 === 7 ? "Dornsife" : c.school);
    const major = v ? v[3]! : (i % 9 === 7 ? "Economics" : c.major);
    const gradYear = i === 0 ? 2021 : 2018 + i % 7;
    const clubs = v ? (i < 50 || i === 57 ? ["HackSC", "LavaLab"] : ["USC Entrepreneurship Club", "Undergraduate Student Government"]) : c.clubs;
    const skills = v ? ["Python", "Research", v[4]!, "Prototyping"] : [...c.skills];
    if (i % 3 === 0) skills.push("Leadership");
    const courses = v ? ["CSCI 104: Data Structures", "ITP 249: Data Analytics", "BAEP 450: Entrepreneurship"] : c.courses;
    const internship = v ? `${role} internship at ${company}` : c.internship;
    const first = v ? `Associate ${role} at ${i % 2 ? "a Los Angeles startup" : company}` : c.first;
    const timeline = [
      { year: `${gradYear - 4}`, title: `Started at USC ${school}`, detail: `Began ${major}; explored ${courses[0]}.`, category: "education" },
      { year: `${gradYear - 3}`, title: `Joined ${clubs[0]}`, detail: `Built a team project and met collaborators through ${clubs[0]}.`, category: "club" },
      { year: `${gradYear - 2}`, title: i % 3 ? "First hands-on experience" : "Undergraduate research", detail: i % 3 ? `Contributed to a student project using ${skills.slice(0, 2).join(" and ")}.` : `Research assistant in USC's Information Sciences Institute; applied ${skills[0]} to real problems.`, category: "project" },
      { year: `${gradYear - 1}`, title: internship, detail: `Summer role applying ${skills[1]} and ${skills[2]}; presented work to a cross-functional team.`, category: "internship" },
      { year: `${gradYear}`, title: `Graduated, ${major}`, detail: `Completed ${courses.slice(1).join(" and ")}; mentored younger ${clubs[0]} members.`, category: "education" },
      { year: `${gradYear}`, title: first, detail: `Converted ${i % 2 ? "an internship" : "USC alumni conversations"} into a first full-time opportunity.`, category: "first-job" },
      { year: `${gradYear + 1}`, title: i % 2 ? "Expanded responsibilities" : "Moved into a specialized team", detail: `Led a small initiative, strengthening ${skills[2]} and communication.`, category: "growth" },
      { year: "Now", title: `${role} at ${company}`, detail: `Works on ${v ? v[4]!.toLowerCase() : c.outcome.toLowerCase()} and supports fellow Trojans.`, category: "current" },
    ];
    return {
      id: i === 0 ? "priya" : `alum-${i + 1}`,
      name, role: "alumni", isDemo: true,
      email: i === 0 ? "priya@demo.careerpath.app" : null,
      passwordHash: i === 0 ? demoHash : null,
      profile: {
        school, major, level: i % 8 === 6 ? "Master's" : "Undergrad", year: "Alumni", gradYear, clubs, skills,
        experience: [i % 3 === 0 ? "USC undergraduate research assistant" : "Student-led consulting project", internship, first],
        courses, interests: v ? [v[4], "Entrepreneurship", "Technology"] : [c.outcome, "Mentorship", "Technology"],
        currentRole: role, company, outcome: v ? v[4] : c.outcome, timeline,
        openToChat: i % 7 !== 4, paused: false, helpTopics: ["Career exploration", "Internship advice", `${role} interviews`],
        availability: availability(i), maxChats: 4,
        bio: i === 0 ? "From late nights at HackSC to building products at Google. Happy to help fellow Trojans find their own path — especially if you're still figuring things out." : `USC ${school} '${String(gradYear).slice(2)}. ${role} at ${company}. I took a few unexpected turns along the way and enjoy helping students explore what comes next.`,
        dreamRole: "", dreamCompany: "",
      },
    };
  });
  const peerNames = ["Alex Kim", "Sarah Chen", "Dev Patel", "Emily Rodriguez", "Jason Wu", "Sophia Lee", "Aaron Davis", "Mia Garcia", "Arjun Rao", "Claire Nguyen", "Noah Park", "Chloe Kim", "Diego Flores", "Hannah Lee", "Isaac Thompson", "Julia Tran", "Kai Wilson", "Lena Shah", "Mateo Cruz", "Nina Kapoor", "Oscar Lin", "Paige Scott", "Ravi Mehta", "Tara Brooks", "Uma Reed"];
  const students = peerNames.map((name, i) => {
    const c = clusters[i % 5]!;
    return {
      id: i === 0 ? "alex" : `student-${i + 1}`, name, role: "student", isDemo: true,
      email: i === 0 ? "alex@demo.careerpath.app" : null, passwordHash: i === 0 ? demoHash : null,
      profile: {
        school: i === 0 ? "Viterbi" : c.school, major: i === 0 ? "Computer Science" : c.major, level: "Undergrad",
        year: i % 4 === 0 ? "Sophomore" : ["Junior", "Sophomore", "Senior"][i % 3], gradYear: 2029,
        clubs: i === 0 ? ["HackSC", "LavaLab"] : c.clubs, skills: i === 0 ? ["Python", "Research", "Java"] : c.skills.slice(0, 2),
        experience: ["USC undergraduate research assistant"], courses: i === 0 ? ["CSCI 104: Data Structures", "CSCI 170: Discrete Methods"] : c.courses.slice(0, 1),
        interests: i === 0 ? ["Technology", "Entrepreneurship", "AI", "Design"] : [c.outcome, "Technology"],
        dreamRole: i % 4 === 0 ? "" : c.role, dreamCompany: i % 4 === 0 ? "" : c.company,
        currentRole: "USC Student", company: "University of Southern California", timeline: [],
        photo: i === 0
          ? "avatars/student-alex.jpg"
          : `avatars/alumni-${String(((i - 1) % 12) + 1).padStart(2, "0")}.jpg`,
        openToChat: true, helpTopics: [], availability: [], maxChats: 4,
        bio: i === 0 ? "CS sophomore exploring what comes next. Usually building something at HackSC or thinking about startup ideas at LavaLab." : `Exploring ${c.outcome.toLowerCase()} and looking for other Trojans to learn alongside.`,
      },
    };
  });
  await db.transaction(async (tx) => {
    await tx.insert(peopleTable).values([...alumni, ...students]).onConflictDoNothing();
    const past = new Date(Date.now() - 22 * 3600000);
    const older = new Date(Date.now() - 6 * 86400000);
    await tx.insert(conversationsTable).values([
      { id: "demo-priya", pair: "alex:priya", firstId: "alex", secondId: "priya", createdAt: past },
      { id: "demo-waiting", pair: "alex:alum-28", firstId: "alex", secondId: "alum-28", createdAt: older },
    ]).onConflictDoNothing();
    await tx.insert(messagesTable).values([
      { id: "demo-msg-1", conversationId: "demo-priya", senderId: "alex", text: "Hi Priya! I'm a CS sophomore in HackSC, like you were. Could I ask how you explored product management coming from engineering?", createdAt: new Date(past.getTime() - 2 * 86400000) },
      { id: "demo-msg-2", conversationId: "demo-priya", senderId: "priya", text: "Hi Alex! Absolutely — HackSC was such a big part of my path. Let's grab 15 minutes. I’d love to hear what you’re working on.", createdAt: new Date(past.getTime() - 86400000) },
      { id: "demo-msg-3", conversationId: "demo-waiting", senderId: "alex", text: "Hi Nathan, I'm a fellow HackSC member exploring software engineering. Could I ask what helped you prepare for your first Apple internship?", createdAt: older },
    ]).onConflictDoNothing();
    await tx.insert(chatsTable).values([
      { id: "demo-past-chat", studentId: "alex", alumniId: "priya", duration: 15, format: "virtual", times: [past.toISOString()], scheduledAt: past.toISOString(), note: "Exploring PM from a CS background.", status: "completed", notes: "Priya said: join ProductSC. Build one small product and interview five users. Practice explaining WHY before HOW. Don't rush into referrals.", summary: "Priya described moving from HackSC engineering projects into Google's APM program. She recommended joining ProductSC and validating a small product with five user interviews before focusing on recruiting.", actionItems: ["Attend a ProductSC event this semester", "Interview five users for a small product project"], createdAt: new Date(past.getTime() - 3 * 86400000) },
      { id: "demo-upcoming-chat", studentId: "alex", alumniId: "alum-2", duration: 30, format: "campus", times: [availability(1)[0]!], scheduledAt: availability(1)[0]!, note: "Would love to compare product and engineering careers.", status: "accepted" },
    ]).onConflictDoNothing();
    await tx.update(peopleTable).set({ extraActions: ["Attend a ProductSC event this semester", "Interview five users for a small product project"] }).where(eq(peopleTable.id, "alex"));
  });
  logger.info("CareerPath sample data seeded: 60 alumni, 25 students");
}
