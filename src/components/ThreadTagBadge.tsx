import React from 'react';
import {
  ArrowUpDown,
  ShieldCheck,
  Lock,
  Layers,
  Coins,
  GitBranch,
} from 'lucide-react';
import { ThreadTagId, ThreadTagMeta } from '../data/azureThemesData';

interface ThreadTagBadgeProps {
  tag: ThreadTagMeta;
  size?: 'xs' | 'sm';
  onDarkPrimaryBg?: boolean;
  onClick?: (tag: ThreadTagMeta, e: React.MouseEvent) => void;
  titlePrefix?: string;
  customTooltip?: string;
  animateOnHover?: boolean;
}

export const getThreadTagIcon = (tagId: ThreadTagId, className = 'w-3 h-3') => {
  switch (tagId) {
    case 'Scaling':
      return <ArrowUpDown className={className} aria-hidden="true" />;
    case 'Reliability':
      return <ShieldCheck className={className} aria-hidden="true" />;
    case 'Security':
      return <Lock className={className} aria-hidden="true" />;
    case 'Responsibility':
      return <Layers className={className} aria-hidden="true" />;
    case 'FinOps':
      return <Coins className={className} aria-hidden="true" />;
    case 'Hybrid/IaC':
      return <GitBranch className={className} aria-hidden="true" />;
  }
};

export const ThreadTagBadge: React.FC<ThreadTagBadgeProps> = ({
  tag,
  size = 'sm',
  onDarkPrimaryBg = false,
  onClick,
  titlePrefix,
  customTooltip,
  animateOnHover = false,
}) => {
  const colorClasses = onDarkPrimaryBg ? tag.activeModuleBadgeClass : tag.badgeClass;
  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[9.5px] gap-1 rounded-md'
      : 'px-2 py-0.5 text-[11px] gap-1 rounded-lg';
  const iconClass = size === 'xs' ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0';
  const tooltip =
    customTooltip ||
    `${titlePrefix ? `${titlePrefix}: ` : ''}${tag.label} — ${tag.shortDescription}${
      onClick ? ' (Click to inspect in Azure Themes)' : ''
    }`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(tag, e);
        }}
        className={`inline-flex items-center font-bold border whitespace-nowrap transition-all hover:brightness-95 dark:hover:brightness-110 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0078D4] ${
          animateOnHover ? 'thread-tag-hover-interactive' : ''
        } ${sizeClasses} ${colorClasses}`}
        title={tooltip}
        aria-label={`Inspect ${tag.label} interconnecting theme`}
      >
        {getThreadTagIcon(tag.id, iconClass)}
        <span>{tag.label}</span>
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-bold border whitespace-nowrap ${sizeClasses} ${colorClasses}`}
      title={tooltip}
    >
      {getThreadTagIcon(tag.id, iconClass)}
      <span>{tag.label}</span>
    </span>
  );
};
