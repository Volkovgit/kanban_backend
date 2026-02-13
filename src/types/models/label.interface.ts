/**
 * Label interface representing a categorical tag for tasks
 */
export interface Label {
  id: string;
  name: string;
  color: string;
  isSystemDefined: boolean;
  projectId: string;
  createdAt: Date;
}
