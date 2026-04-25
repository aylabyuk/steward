import type { Klass, LexicalNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { VariableChipNode } from "@/features/program-templates/nodes/VariableChipNode";
import { SignatureBlockNode } from "./nodes/SignatureBlockNode";
import { AssignedSundayCalloutNode } from "./nodes/AssignedSundayCalloutNode";
import { ImageNode } from "./nodes/ImageNode";

/** Union of every node the WYSIWYG page editor knows about. Each
 *  host editor (letter, conducting program, congregation program)
 *  layers its own domain nodes onto this base via
 *  `letterEditorConfig` / `programEditorConfig`. */
export const PAGE_EDITOR_BASE_NODES: ReadonlyArray<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
  VariableChipNode,
  SignatureBlockNode,
  AssignedSundayCalloutNode,
  ImageNode,
];
