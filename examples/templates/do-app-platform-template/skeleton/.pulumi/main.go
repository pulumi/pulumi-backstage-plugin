package main

import (
	"github.com/pulumi/pulumi-digitalocean/sdk/v4/go/digitalocean"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {

		cfg := config.New(ctx, "")
		app, err := digitalocean.NewApp(ctx, "my-app", &digitalocean.AppArgs{
			Spec: &digitalocean.AppSpecArgs{
				Name:   pulumi.String(cfg.Get("appName")),
				Region: pulumi.String(cfg.Get("region")),
				Services: digitalocean.AppSpecServiceArray{
					&digitalocean.AppSpecServiceArgs{
						Name: pulumi.String("go"),
						Git: &digitalocean.AppSpecServiceGitArgs{
							RepoCloneUrl: pulumi.String(cfg.Get("repoCloneUrl")),
							Branch:       pulumi.String(cfg.Get("branch")),
						},
						InstanceCount:    pulumi.Int(cfg.GetInt("instanceCount")),
						InstanceSizeSlug: pulumi.String(cfg.Get("instanceSize")),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		ctx.Export("url", app.LiveUrl)
		return nil
	})
}
