'use client';

import { useState } from 'react';

import { Alert, Badge, Button, Spinner } from '@/components/ui';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { useMembers, useSetMemberRole, type Member } from '@/lib/roles';

/**
 * Les administrateurs, geres par les proprietaires.
 *
 * Un administrateur peut creer une scene depuis un lien YouTube, qui part
 * chez le worker du PC de l'hote. C'est un droit qui engage une machine :
 * seuls les proprietaires le donnent et le retirent, et le leur ne se
 * touche pas depuis l'application.
 *
 * La liste est celle des invites. Un role se donne a une adresse, meme
 * avant que la personne ne se soit connectee.
 */
export function AdminCard() {
  const t = useT();
  const members = useMembers(true);
  const setRole = useSetMemberRole();
  const [error, setError] = useState<string | null>(null);

  const libelle = (member: Member) =>
    member.role === 'owner'
      ? t.admin.roleOwner
      : member.role === 'admin'
        ? t.admin.roleAdmin
        : t.admin.roleUser;

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-text-faint">{t.admin.help}</p>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {members.isLoading ? <Spinner /> : null}

      <ul className="divide-y divide-border">
        {(members.data ?? []).map((member) => (
          <li
            key={member.email}
            className="flex flex-wrap items-center justify-between gap-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {member.display_name ?? member.email}
              </p>
              <p className="truncate text-xs text-text-faint">
                {member.display_name ? member.email : null}
                {!member.has_account
                  ? `${member.display_name ? ' · ' : ''}${t.admin.noAccount}`
                  : null}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                tone={
                  member.role === 'owner'
                    ? 'accent'
                    : member.role === 'admin'
                      ? 'ok'
                      : 'neutral'
                }
              >
                {libelle(member)}
              </Badge>
              {member.role !== 'owner' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="btn-bascule"
                  loading={setRole.isPending && setRole.variables?.email === member.email}
                  disabled={setRole.isPending && setRole.variables?.email !== member.email}
                  onClick={() => {
                    setError(null);
                    setRole.mutate(
                      {
                        email: member.email,
                        role: member.role === 'admin' ? 'user' : 'admin',
                      },
                      { onError: (e) => setError(humanizeError(e)) },
                    );
                  }}
                >
                  {member.role === 'admin' ? t.admin.demote : t.admin.promote}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
