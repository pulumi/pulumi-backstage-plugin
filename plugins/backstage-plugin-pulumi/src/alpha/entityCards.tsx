import { compatWrapper } from '@backstage/core-compat-api';
import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { isPulumiAvailableEntityPredicate } from './entityPredicates';

/**
 * Entity Card - Pulumi Stack information
 *
 * @alpha
 */
export const entityPulumiCard: any = EntityCardBlueprint.make({
  name: 'stack',
  params: {
    filter: isPulumiAvailableEntityPredicate,
    async loader() {
      const { EntityPulumiCard } = await import(
        '../components/EntityPulumiCard/EntityPulumiCard'
      );
      return compatWrapper(<EntityPulumiCard />);
    },
  },
});

/**
 * Entity Card - Pulumi Organization Metadata
 *
 * @alpha
 */
export const entityPulumiMetadataCard: any = EntityCardBlueprint.make({
  name: 'metadata',
  params: {
    filter: isPulumiAvailableEntityPredicate,
    async loader() {
      const { EntityPulumiMetdataCard } = await import(
        '../components/EntityPulumiCard/EntityPulumiCard'
      );
      return compatWrapper(<EntityPulumiMetdataCard />);
    },
  },
});
