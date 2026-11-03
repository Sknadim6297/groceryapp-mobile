import {
    buildCustomerProfile,
    installCustomerProfileStoreForTests,
    loadCustomerProfile,
    parseProfileVault,
    profileOwnerKey,
    saveCustomerProfile,
    serializeProfileVault,
} from "../src/services/customerProfileStore";

async function main() {
  installCustomerProfileStoreForTests(null);

  if (
    profileOwnerKey({ kind: "temporary-ui", mobile: "9000000001" }) !==
    "temporary-ui:9000000001"
  ) {
    throw new Error(
      "profile owner key must scope edits to the signed-in mobile",
    );
  }
  if (profileOwnerKey({ kind: "temporary-ui", mobile: "12" }) !== null) {
    throw new Error("invalid mobiles must not own a profile book");
  }

  const owner = "temporary-ui:9000000001";
  const built = buildCustomerProfile(owner, "9000000001", {
    name: "Asha Verma",
    email: "asha@example.com",
    dateOfBirth: "1994-05-12",
  });
  if (!built || built.name !== "Asha Verma") {
    throw new Error("valid profile draft should build");
  }
  if (
    buildCustomerProfile(owner, "9000000001", {
      name: "A",
      email: "bad",
      dateOfBirth: "",
    })
  ) {
    throw new Error("invalid name/email must be rejected");
  }

  const memory = new Map<string, string>();
  installCustomerProfileStoreForTests({
    async read() {
      return memory.get("groceryapp.customer-profiles") ?? null;
    },
    async write(value) {
      memory.set("groceryapp.customer-profiles", value);
    },
    async remove() {
      memory.delete("groceryapp.customer-profiles");
    },
  });

  if (!(await saveCustomerProfile(built))) {
    throw new Error("save should succeed");
  }
  const restored = await loadCustomerProfile(owner);
  if (
    !restored ||
    restored.email !== "asha@example.com" ||
    restored.dateOfBirth !== "1994-05-12"
  ) {
    throw new Error("profile must persist across a simulated restart");
  }

  const otherOwner = "temporary-ui:9000000002";
  const other = buildCustomerProfile(otherOwner, "9000000002", {
    name: "Other User",
    email: "",
    dateOfBirth: "",
  });
  if (!other || !(await saveCustomerProfile(other))) {
    throw new Error("second owner profile should save");
  }
  if ((await loadCustomerProfile(owner))?.name !== "Asha Verma") {
    throw new Error("owners must not share editable profiles");
  }

  const vault = parseProfileVault(
    serializeProfileVault({ [owner]: restored, [otherOwner]: other }),
  );
  if (!vault[owner] || !vault[otherOwner]) {
    throw new Error("vault round-trip must keep both owners");
  }

  console.log("customer profile fixtures passed");
}

void main();
