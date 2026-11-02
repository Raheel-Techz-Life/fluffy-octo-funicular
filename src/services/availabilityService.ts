import { AvailabilityStatus, WorkerProfile, WorkerSkill } from '../types/worker';

export interface AvailabilityResolution {
  currentStatus: AvailabilityStatus;
  requiresAgentConfirmation: boolean;
  statusLabel: string;
  badgeVariant: 'green' | 'amber' | 'red' | 'slate' | 'blue';
  explanation: string;
}

/**
 * Resolves the real-time availability status for a worker or skill,
 * taking into account whether an expected busy period has passed.
 * RULE: If the expected availability time passes, mark availability
 * as requiring confirmation rather than automatically assuming the worker is free!
 */
export function resolveAvailability(
  status: AvailabilityStatus,
  expectedAvailableAt: string | null,
  unavailabilityReason?: string
): AvailabilityResolution {
  const now = new Date();

  // If marked temporarily unavailable but expected time has passed
  if (status === 'temporarily_unavailable' && expectedAvailableAt) {
    const expDate = new Date(expectedAvailableAt);
    if (now.getTime() > expDate.getTime()) {
      return {
        currentStatus: 'availability_pending',
        requiresAgentConfirmation: true,
        statusLabel: 'Confirmation Needed',
        badgeVariant: 'amber',
        explanation: `Previous job commitment ended on ${expDate.toLocaleDateString('en-IN')}. Awaiting field agent re-confirmation.`,
      };
    }
  }

  switch (status) {
    case 'available':
      return {
        currentStatus: 'available',
        requiresAgentConfirmation: false,
        statusLabel: 'Available Today',
        badgeVariant: 'green',
        explanation: 'Agent-confirmed available for new job dispatch.',
      };
    case 'temporarily_unavailable':
      return {
        currentStatus: 'temporarily_unavailable',
        requiresAgentConfirmation: false,
        statusLabel: 'Busy on Project',
        badgeVariant: 'amber',
        explanation: unavailabilityReason || 'Currently assigned to another customer project.',
      };
    case 'availability_pending':
      return {
        currentStatus: 'availability_pending',
        requiresAgentConfirmation: true,
        statusLabel: 'Agent Confirmation Required',
        badgeVariant: 'amber',
        explanation: 'Field agent verification in progress before dispatch.',
      };
    case 'contact_unsuccessful':
      return {
        currentStatus: 'contact_unsuccessful',
        requiresAgentConfirmation: true,
        statusLabel: 'Contact Unsuccessful',
        badgeVariant: 'red',
        explanation: 'Worker did not answer last verification call.',
      };
    case 'not_interested':
      return {
        currentStatus: 'not_interested',
        requiresAgentConfirmation: false,
        statusLabel: 'Declined Specific Job',
        badgeVariant: 'slate',
        explanation: 'Worker declined specific request; remains open for other matching inquiries.',
      };
    case 'profile_inactive':
      return {
        currentStatus: 'profile_inactive',
        requiresAgentConfirmation: true,
        statusLabel: 'Profile Inactive',
        badgeVariant: 'slate',
        explanation: 'Profile temporarily suspended by platform administrator.',
      };
    default:
      return {
        currentStatus: 'available',
        requiresAgentConfirmation: false,
        statusLabel: 'Available',
        badgeVariant: 'green',
        explanation: 'Available for work.',
      };
  }
}
