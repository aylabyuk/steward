import { $convertFromMarkdownString } from "@lexical/markdown";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { $createVariableChipNode } from "@/features/program-templates/nodes/VariableChipNode";
import { $createAssignedSundayCalloutNode } from "./nodes/AssignedSundayCalloutNode";
import { $createLetterheadNode } from "./nodes/LetterheadNode";
import { $createSignatureBlockNode } from "./nodes/SignatureBlockNode";
import { LETTER_MARKDOWN_TRANSFORMERS } from "./letterEditorConfig";

interface BuildOpts {
  bodyMarkdown: string;
  footerMarkdown: string;
}

const SIGNATURE_CLOSING_PATTERN =
  /^(with gratitude|with appreciation|sincerely|in faith)\s*[,.]?\s*$/i;

/** Builds a Lexical EditorState for a brand-new prayer-letter editor.
 *  Distinct from `buildInitialLetterState` in chrome content:
 *
 *  - Letterhead title: "Invitation to Pray" (vs "Invitation to Speak")
 *  - Eyebrow + subtitle reuse the speaker shape so the masthead reads
 *    consistently across a ward's stationery
 *  - Body hydrates from the prayer markdown defaults (shorter, more
 *    reverent, prayer-shaped)
 *  - Same callout / signature / footer chrome flow as the speaker
 *    letter so the bishop's mental model carries over
 *
 *  The greeting-detection heuristic still runs ("Dear …") so the
 *  assigned-Sunday callout slots in after the opening. */
export function buildInitialPrayerLetterState({ bodyMarkdown, footerMarkdown }: BuildOpts) {
  return () => {
    $convertFromMarkdownString(bodyMarkdown, LETTER_MARKDOWN_TRANSFORMERS);
    const root = $getRoot();
    const bodyChildren = [...root.getChildren()];
    root.clear();

    root.append(
      $createLetterheadNode(
        "Sacrament Meeting · {{wardName}}",
        "Invitation to Pray",
        "From the Bishopric",
      ),
    );

    const dateLine = $createParagraphNode();
    dateLine.append($createVariableChipNode("today"));
    root.append(dateLine);

    for (const child of bodyChildren) root.append(child);

    const greetingIdx = root
      .getChildren()
      .findIndex(
        (c) => c.getType() === "paragraph" && c.getTextContent().toLowerCase().startsWith("dear"),
      );
    const callout = $createAssignedSundayCalloutNode();
    if (greetingIdx >= 0) {
      root.getChildren()[greetingIdx]!.insertAfter(callout);
    } else {
      root.append(callout);
    }
    const last = root.getChildren().at(-1);
    if (last && SIGNATURE_CLOSING_PATTERN.test(last.getTextContent().trim())) last.remove();
    root.append($createSignatureBlockNode());
    if (footerMarkdown.trim().length > 0) {
      const footerPara = $createParagraphNode();
      footerPara.setFormat("center");
      footerPara.append($createTextNode(footerMarkdown));
      root.append(footerPara);
    }
  };
}
