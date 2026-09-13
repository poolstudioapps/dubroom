'use client';

import { SelectMenu } from '@/components/select-menu';
import { TagInput } from '@/components/tag-input';
import { UrlPreview, videoId } from '@/components/url-preview';
import { Input, Label } from '@/components/ui';
import { useT } from '@/lib/i18n';
import {
  PACK_GENRES,
  PACK_LANGS,
  lienValide,
  type PackFacets,
  type PackGenre,
} from '@/lib/packs';

/** Les criteres sans lesquels on ne publie pas. */
export function facetsComplete(f: PackFacets): boolean {
  return !!f.title.trim() && lienValide(f.sourceUrl) && !!f.sourceLang && !!f.genre;
}

/**
 * Ce qu'on renseigne sur une scene de la communaute.
 *
 * Le meme formulaire a la creation d'un pack, a la publication et a la
 * retouche : trois copies auraient fini par ne pas demander la meme
 * chose.
 *
 * Le lien d'origine est obligatoire. C'est l'apercu de la fiche, et c'est
 * par la que ceux qui rejouent la scene recuperent la video : sans lui,
 * un pack se lit mais ne se joue pas.
 */
export function PackFacetsFields({
  value,
  onChange,
  idPrefix,
  hideTitle = false,
}: {
  value: PackFacets;
  onChange: (next: PackFacets) => void;
  idPrefix: string;
  /** Le titre est deja demande ailleurs sur l'ecran. */
  hideTitle?: boolean;
}) {
  const t = useT();
  const maj = (partiel: Partial<PackFacets>) => onChange({ ...value, ...partiel });

  const lien = value.sourceUrl.trim();
  const lienKo = lien.length > 0 && !lienValide(lien);
  const apercu = !lienKo && lien && videoId(lien);

  return (
    <div className="space-y-4">
      {hideTitle ? null : (
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
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-lien`}>
          {t.community.linkLabel} <Requis />
        </Label>
        <Input
          id={`${idPrefix}-lien`}
          type="url"
          inputMode="url"
          value={value.sourceUrl}
          maxLength={500}
          aria-invalid={lienKo || undefined}
          aria-describedby={`${idPrefix}-lien-aide`}
          onChange={(e) => maj({ sourceUrl: e.target.value })}
          placeholder={t.community.linkPlaceholder}
        />
        <p id={`${idPrefix}-lien-aide`} className={lienKo ? 'text-xs text-danger-ink' : 'text-xs leading-relaxed text-text-faint'}>
          {lienKo ? t.community.linkInvalid : t.community.linkHelp}
        </p>
        {/* La vignette confirme qu'on a colle le bon extrait. */}
        {apercu ? (
          <div className="w-44 max-w-full">
            <UrlPreview url={lien} title={value.title || lien} />
          </div>
        ) : null}
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
export function Requis() {
  const t = useT();
  return (
    <span className="text-danger" title={t.community.required}>
      *<span className="sr-only"> ({t.community.required})</span>
    </span>
  );
}
