import React, { useState, useEffect } from 'react';
import { Lock, LockOpen, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getSettingsLockStatus } from '../../services/SettingsHelper';

export interface SecurityStatusProps {
  isUnlocked: boolean;
  onUnlockClick?: () => void;
  className?: string;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({
  isUnlocked,
  onUnlockClick,
  className,
}) => {
  const [lockStatus, setLockStatus] = useState({
    isLocked: false,
    hasSettings: false,
    modelCount: 0,
  });

  useEffect(() => {
    const loadStatus = async () => {
      const status = await getSettingsLockStatus();
      setLockStatus(status);
    };
    loadStatus();
  }, []);

  if (!lockStatus.hasSettings) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-yellow-500',
          className
        )}
      >
        <AlertTriangle className="w-4 h-4" />
        <span>No API keys configured</span>
      </div>
    );
  }

  if (!lockStatus.isLocked) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-gray-400',
          className
        )}
      >
        <LockOpen className="w-4 h-4" />
        <span>{lockStatus.modelCount} model(s) available</span>
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center gap-2 text-sm', className)}
      onClick={onUnlockClick}
    >
      {isUnlocked ? (
        <>
          <LockOpen className="w-4 h-4 text-green-500" />
          <span className="text-green-500">Settings unlocked</span>
        </>
      ) : (
        <>
          <Lock className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-400">
            Settings locked
            {onUnlockClick && (
              <button
                onClick={onUnlockClick}
                className="ml-2 text-blue-500 hover:text-blue-400 underline"
              >
                Unlock
              </button>
            )}
          </span>
        </>
      )}
    </div>
  );
};

/**
 * Compact status badge for use in headers/footers
 */
export const SecurityStatusBadge: React.FC<{
  isUnlocked: boolean;
  onClick?: () => void;
}> = ({ isUnlocked, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
        isUnlocked
          ? 'bg-green-500 bg-opacity-10 text-green-500 hover:bg-opacity-20'
          : 'bg-yellow-500 bg-opacity-10 text-yellow-500 hover:bg-opacity-20'
      )}
      title={isUnlocked ? 'Settings are unlocked' : 'Click to unlock settings'}
    >
      {isUnlocked ? (
        <LockOpen className="w-3.5 h-3.5" />
      ) : (
        <Lock className="w-3.5 h-3.5" />
      )}
      <span>{isUnlocked ? 'Unlocked' : 'Locked'}</span>
    </button>
  );
};
