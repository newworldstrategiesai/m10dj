import Link from 'next/link';
import { User, Calendar } from 'lucide-react';

/**
 * AuthorByline Component
 * Displays author attribution for E-E-A-T compliance
 * 
 * @param {Object} props
 * @param {string} props.authorName - Name of the author (default: "Ben Murray")
 * @param {string} props.authorUrl - URL to author bio page (default: "/about/ben-murray")
 * @param {string} props.jobTitle - Author's job title (default: "Founder & Lead DJ")
 * @param {string} props.experience - Years of experience (default: "15+ Years Experience")
 * @param {string} props.lastUpdated - Last updated date (optional)
 * @param {boolean} props.showDate - Whether to show last updated date
 * @param {string} props.className - Additional CSS classes
 */
export default function AuthorByline({
  authorName = "Ben Murray",
  authorUrl = "/about/ben-murray",
  jobTitle = "Founder & Lead DJ",
  experience = "15+ Years Experience",
  lastUpdated,
  showDate = false,
  className = ""
}) {
  return (
    <div className={`flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      <div className="flex items-center">
        <User className="w-4 h-4 mr-2 text-brand-gold" />
        <span className="mr-2">Written by</span>
        <Link 
          href={authorUrl}
          className="font-semibold text-brand-gold hover:text-brand-gold-dark transition-colors"
        >
          {authorName}
        </Link>
        <span className="mx-2">•</span>
        <span>{jobTitle}</span>
        <span className="mx-2">•</span>
        <span>{experience}</span>
      </div>
      
      {showDate && lastUpdated && (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      )}
    </div>
  );
}

