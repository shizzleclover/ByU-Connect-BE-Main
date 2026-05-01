import { Profile } from "../features/profile/profile.model";
import { Service } from "../features/services/services.model";
import { Project } from "../features/projects/projects.model";
import { Link } from "../features/links/links.model";
import { Story } from "../features/stories/stories.model";
import { Contact } from "../features/contacts/contacts.model";
import { Resume } from "../features/resume/resume.model";
import { User } from "../models/user.model";
import { COMPLETENESS_WEIGHTS } from "../config/constants";

export async function recomputeCompleteness(profileId: string): Promise<void> {
  const [profile, services, projects, links, stories, contacts, resume] =
    await Promise.all([
      Profile.findById(profileId).lean(),
      Service.find({ profileId }).lean(),
      Project.find({ profileId }).lean(),
      Link.find({ profileId }).lean(),
      Story.find({ profileId }).lean(),
      Contact.find({ profileId }).lean(),
      Resume.findOne({ profileId }).lean(),
    ]);

  if (!profile) return;

  const user = await User.findById(profile.userId).lean();
  if (!user) return;

  let score = 0;
  if (profile.avatarUrl) score += COMPLETENESS_WEIGHTS.avatar;
  if (profile.bio) score += COMPLETENESS_WEIGHTS.bio;
  if (profile.department) score += COMPLETENESS_WEIGHTS.department;
  if (profile.year) score += COMPLETENESS_WEIGHTS.year;
  if (services.length > 0) score += COMPLETENESS_WEIGHTS.hasService;
  if (projects.some((p) => p.isPublished)) score += COMPLETENESS_WEIGHTS.hasProject;
  if (links.length > 0) score += COMPLETENESS_WEIGHTS.hasLink;
  if (stories.some((s) => s.isPublished)) score += COMPLETENESS_WEIGHTS.hasStory;
  if (contacts.length > 0) score += COMPLETENESS_WEIGHTS.hasContactMethod;
  if (resume) score += COMPLETENESS_WEIGHTS.hasResume;
  if (user.studentEmailVerifiedAt) score += COMPLETENESS_WEIGHTS.studentEmailVerified;

  score = Math.min(score, 100);

  await Profile.updateOne({ _id: profileId }, { completenessScore: score });
}
