'use client';

import { SelectMenu } from '@/components/select-menu';
import { TagInput } from '@/components/tag-input';
import { Input, Label } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { PACK_GENRES, PACK_LANGS, type PackFacets, type PackGenre } from '@/lib/packs';

/** Les trois criteres sans lesquels on ne publie pas. */
export function facetsComplete(f: PackFacets): boolean {
  return !!f.title.trim() && !!f.sourceLang && !!f.genre;
}

/**
 * Ce qu'on renseigne sur une scene de la communaute.
 *
 * Le meme formulaire a la publication et a la retouche : deux copies
 * auraient fini par ne pas demander la meme chose.
 */
export function PackFacetsFields({
  value,
  onChange,
  idPrefix,
}: {
  value: PackFacets;
  onChange: (next: PackFacets) => void;
  idPrefix: string;
}) {
  const t = useT();
  const maj = (partiel: Partial<PackFacets>) => onChange({ ...value, ...partiel });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-titre`}>
          {t.create.titleLabel} <Requis />
        </Label>
        <Input
          id={`${idPrefix}-titre`}
          value={value.title}
          maxLength={120}
          onChange={(e) => maj({ title: e.target.value })}
          placeholder={t.create.titlePlaceholder}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            {t.community.filterLang} <Requis />
          </Label>
          <SelectMenu
            label={t.community.filterLang}
            value={value.sourceLang}
            placeholder={t.community.pickLang}
            onChange={(sourceLang) => maj({ sourceLang })}
            options={PACK_LANGS.map((code) => ({
              value: code as string,
              label: t.community.langNames[code] ?? code,
            }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            {t.community.filterGenre} <Requis />
          </Label>
          <SelectMenu
            label={t.community.filterGenre}
            value={value.genre}
            placeholder={t.community.pickGenre}
            onChange={(genre) => maj({ genre: genre as PackGenre })}
            options={PACK_GENRES.map((genre) => ({
              value: genre as string,
              label: t.community.genreNames[genre] ?? genre,
            }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-tags`}>{t.community.tagsLabel}</Label>
        <TagInput id={`${idPrefix}-tags`} value={value.tags} onChange={(tags) => maj({ tags })} />
        <p className="text-xs leading-relaxed text-text-faint">{t.community.tagsHelp}</p>
      </div>
    </div>
  );
}

/** L'asterisque des champs obligatoires, lue « obligatoire » a voix haute. */
function Requis() {
  const t = useT();
  return (
    <span className="text-danger" title={t.community.required}>
      *<span className="sr-only"> ({t.community.required})</span>
    </span>
  );
}
