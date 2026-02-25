export type BlockType = 'paragraph' | 'heading' | 'todo' | 'quote' | 'divider';

export interface BlockData {
  id: string;
  type: BlockType;
  content: string;
  props: Record<string, unknown>;
  children: string[];
}

export interface HeadingProps {
  level: 1 | 2 | 3;
}

export interface TodoProps {
  checked: boolean;
}

export const DEFAULT_BLOCK_PROPS: Record<BlockType, Record<string, unknown>> = {
  paragraph: {},
  heading: { level: 2 },
  todo: { checked: false },
  quote: {},
  divider: {},
};
