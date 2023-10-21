import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";

const hello = new command.local.Command("hello", {
    create: "echo hello",
    delete: "echo goodbye",
    update: "echo hello again",
})

export const helloMessage = hello.stdout;
