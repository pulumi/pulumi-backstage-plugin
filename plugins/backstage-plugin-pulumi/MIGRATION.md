# Frontend System Migration Guide

This document provides guidance on maintaining compatibility between the legacy and new Backstage frontend systems.

## Current Status

As of Backstage v1.42.0, the New Frontend System is marked as **"Adoption Ready"**. This plugin supports both systems:

- **Legacy system**: Import from `@pulumi/backstage-plugin-pulumi`
- **New frontend system**: Import from `@pulumi/backstage-plugin-pulumi/alpha`

## Dual Support Recommendation

Since `@pulumi/backstage-plugin-pulumi` is a published plugin used by external consumers, we maintain dual support for both frontend systems.

### Guidelines

1. **Keep both exports**: Maintain the legacy exports in `src/index.ts` and the new frontend system exports in `src/alpha/`

2. **Timeline**: Continue dual support until Backstage officially deprecates the legacy system. This could be 1-2 major versions of Backstage (estimate: 6-12 months), but there is no official timeline yet.

3. **Monitor releases**: Watch [Backstage release notes](https://github.com/backstage/backstage/releases) for deprecation announcements regarding the legacy frontend system.

4. **Testing**: Ensure changes work with both systems before releasing new versions.

## Architecture

```
src/
├── index.ts              # Legacy exports (do not modify for new system)
├── alpha/
│   ├── index.ts          # New frontend system entry point
│   ├── plugin.ts         # createFrontendPlugin definition
│   ├── apis.ts           # ApiBlueprint extensions
│   ├── entityCards.tsx   # EntityCardBlueprint extensions
│   ├── entityContents.tsx # EntityContentBlueprint extensions
│   ├── entityPredicates.ts # Entity filter predicates
│   └── pages.tsx         # PageBlueprint extensions
└── components/           # Shared components (used by both systems)
```

## References

- [Backstage Frontend System Documentation](https://backstage.io/docs/frontend-system/)
- [Migration Guide](https://backstage.io/docs/frontend-system/building-plugins/migrating/)
- [Backstage v1.42.0 Release Notes](https://github.com/backstage/backstage/releases/tag/v1.42.0)
