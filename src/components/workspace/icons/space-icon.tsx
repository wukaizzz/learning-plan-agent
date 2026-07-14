// 图标组件
export const LogoIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="url(#gradient1)" />
    <text x="16" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">AI</text>
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#667eea' }} />
        <stop offset="100%" style={{ stopColor: '#764ba2' }} />
      </linearGradient>
    </defs>
  </svg>
);

export const HomeIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9L9 3L15 9M11 15H21M11 15L13 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SpaceIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PlanIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V15C5 16.1046 5.89543 17 7 17H13C14.1046 17 15 16.1046 15 15V7C15 5.89543 14.1046 5 13 5H9Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M9 8H11M9 11H11M9 14H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const TaskIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11L12 14L22 4M22 4H18M22 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12V20C22 20.9 21.1 20 20 20H4C2.9 20 2 20.9 2 22V4C2 2.9 2.9 2 4 2H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const RecordIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="10" cy="10" r="3" fill="currentColor"/>
  </svg>
);

export const ChartIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12V18C3 19.1046 3.89543 20 5 20H15C16.1046 20 17 19.1046 17 18V12" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M3 12C3 8 7 4 9 4M9 4V12M15 4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const GoalIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="10" cy="10" r="3" fill="currentColor"/>
  </svg>
);

export const SettingsIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
    <path d="M10 2V4M10 16V18M18 10H16M4 10H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const PlusIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const GridIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const ListIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ChevronDownIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BookIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M6 5V17M6 5C6 3.5 7.5 2 9.5 2C11.5 2 13 3.5 13 5V17" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const PlayIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="6 4 6 16 16 10" stroke="currentColor" strokeWidth="2" fill="currentColor" strokeLinejoin="round"/>
  </svg>
);

export const CheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 3L7 13L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const ClockIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 4V10L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PauseIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="3" height="12" rx="1" fill="currentColor"/>
    <rect x="11" y="4" width="3" height="12" rx="1" fill="currentColor"/>
  </svg>
);

export const SearchIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M14 14L11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);