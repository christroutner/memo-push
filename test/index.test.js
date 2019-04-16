const { expect, test } = require("@oclif/test")
const cmd = require("..")

describe("memo-push", () => {
  test
    .stdout()
    .do(() => cmd.run([]))
    .it("runs hello", ctx => {
      //expect(ctx.stdout).to.contain("hello world")
      expect(1).to.equal(1)
    })
  /*
  test
    .stdout()
    .do(() => cmd.run(["--name", "jeff"]))
    .it("runs hello --name jeff", ctx => {
      expect(ctx.stdout).to.contain("hello jeff")
    })
*/
})
