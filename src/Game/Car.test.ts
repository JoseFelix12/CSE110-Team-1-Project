import { describe, it, expect, beforeEach } from "vitest";
import { Car } from './Car.ts';
import type { CarData, ReadonlyCar } from './Car.ts';
import { DEFAULT_SKIN, ENGINE_SPEED_BONUS_PER_LEVEL, MAX_HEALTH, SKIN_PRICES } from './gameConfig.ts';
import type { SkinColor } from './gameConfig.ts';

/** fromSave receives untrusted data, so tests need to pass values outside its declared type */
const fromRaw = (raw: unknown): Car => Car.fromSave(raw as Partial<CarData>);

const ALL_SKINS = Object.keys(SKIN_PRICES) as SkinColor[];

/** A fully populated, valid save that differs from the defaults in every field */
const validSave = (): CarData => ({
    skin: 'purple',
    engineLevel: 2,
    speedMultiplier: 1.2,
    upgrades: ['Speed Boost', 'Shield'],
    cosmetics: ['spoiler', 'flames'],
    health: 35,
});

describe("Car", () => {
    let car: Car;

    beforeEach(() => {
        car = new Car();
    });

    describe("defaultData: returns the starting values for a brand-new car", () => {
        it("has the expected value for every attribute", () => {
            expect(Car.defaultData()).toEqual({
                skin: DEFAULT_SKIN,
                engineLevel: 0,
                speedMultiplier: 1,
                upgrades: [],
                cosmetics: [],
                health: MAX_HEALTH,
            });
        });
    });

    describe("constructor: builds a car from defaults or from given CarData", () => {
        it("uses defaultData when no argument is given", () => {
            expect(car.toJSON()).toEqual(Car.defaultData());
        });

        it("uses defaultData when undefined is passed explicitly", () => {
            expect(new Car(undefined).toJSON()).toEqual(Car.defaultData());
        });

        it("stores every attribute of the given data", () => {
            const custom = new Car(validSave());
            expect(custom.getSkin()).toBe('purple');
            expect(custom.getEngineLevel()).toBe(2);
            expect(custom.getSpeedMultiplier()).toBe(1.2);
            expect(custom.getUpgrades()).toEqual(['Speed Boost', 'Shield']);
            expect(custom.getCosmetics()).toEqual(['spoiler', 'flames']);
            expect(custom.getHealth()).toBe(35);
        });

        it("can be used through the ReadonlyCar interface", () => {
            const readonly: ReadonlyCar = new Car(validSave());
            expect(readonly.getSkin()).toBe('purple');
            expect(readonly.getHealth()).toBe(35);
        });
    });

    describe("getUpgrades / getCosmetics: return copies, not the car's internal arrays", () => {
        it("getUpgrades: mutating the returned array does not change the car", () => {
            const custom = new Car(validSave());
            const upgrades = custom.getUpgrades();
            upgrades.push('Better Tires');
            upgrades.length = 0;
            expect(custom.getUpgrades()).toEqual(['Speed Boost', 'Shield']);
        });

        it("getCosmetics: mutating the returned array does not change the car", () => {
            const custom = new Car(validSave());
            const cosmetics = custom.getCosmetics();
            cosmetics.push('decal');
            cosmetics.length = 0;
            expect(custom.getCosmetics()).toEqual(['spoiler', 'flames']);
        });

        it("returns a different array instance on each call", () => {
            expect(car.getUpgrades()).not.toBe(car.getUpgrades());
            expect(car.getCosmetics()).not.toBe(car.getCosmetics());
        });
    });

    describe("setColor: changes only the car's skin", () => {
        it.each(ALL_SKINS)("sets the skin to %s", (skin) => {
            car.setColor(skin);
            expect(car.getSkin()).toBe(skin);
        });

        it("overwrites a previously set skin", () => {
            car.setColor('blue');
            car.setColor('green');
            expect(car.getSkin()).toBe('green');
        });
    });

    describe("upgradeEngine: raises the engine level by exactly one", () => {
        it("goes from 0 to 1 on a new car", () => {
            car.upgradeEngine();
            expect(car.getEngineLevel()).toBe(1);
        });

        it("increments on every call", () => {
            car.upgradeEngine();
            car.upgradeEngine();
            car.upgradeEngine();
            expect(car.getEngineLevel()).toBe(3);
        });

        it("does not change the speed multiplier by itself", () => {
            car.upgradeEngine();
            expect(car.getSpeedMultiplier()).toBe(1);
        });
    });

    describe("updateSpeedMultiplier: recalculates speed as 1 + engineLevel * ENGINE_SPEED_BONUS_PER_LEVEL", () => {
        it("is 1 at engine level 0", () => {
            car.updateSpeedMultiplier();
            expect(car.getSpeedMultiplier()).toBe(1);
        });

        it.each([1, 2, 3, 10])("matches the formula at engine level %i", (level) => {
            for (let i = 0; i < level; i++) car.upgradeEngine();
            car.updateSpeedMultiplier();
            expect(car.getSpeedMultiplier()).toBeCloseTo(1 + level * ENGINE_SPEED_BONUS_PER_LEVEL);
        });
    });

    describe("inflictDamage: lowers health, floored at 0", () => {
        it("subtracts the amount from current health", () => {
            car.inflictDamage(10);
            expect(car.getHealth()).toBe(MAX_HEALTH - 10);
        });

        it("accumulates across multiple hits", () => {
            car.inflictDamage(10);
            car.inflictDamage(25);
            expect(car.getHealth()).toBe(MAX_HEALTH - 35);
        });

        it("does nothing when the amount is 0", () => {
            car.inflictDamage(0);
            expect(car.getHealth()).toBe(MAX_HEALTH);
        });

        it("can reach exactly 0", () => {
            car.inflictDamage(MAX_HEALTH);
            expect(car.getHealth()).toBe(0);
        });

        it("floors at 0 when a single hit is too large", () => {
            car.inflictDamage(MAX_HEALTH + 50);
            expect(car.getHealth()).toBe(0);
        });

        it("floors at 0 when hits add up past it", () => {
            car.inflictDamage(MAX_HEALTH - 5);
            car.inflictDamage(10);
            expect(car.getHealth()).toBe(0);
        });

        it("stays at 0 when already wrecked", () => {
            car.inflictDamage(MAX_HEALTH);
            car.inflictDamage(1);
            expect(car.getHealth()).toBe(0);
        });

        it.each([-10, -Infinity, NaN])("throws for an invalid amount (%s) and leaves health unchanged", (amount) => {
            car.inflictDamage(20);
            expect(() => car.inflictDamage(amount)).toThrow(RangeError);
            expect(car.getHealth()).toBe(MAX_HEALTH - 20);
        });
    });

    describe("undoDamage: restores health, capped at MAX_HEALTH", () => {
        beforeEach(() => {
            car.inflictDamage(50);
        });

        it("adds the amount to current health", () => {
            car.undoDamage(20);
            expect(car.getHealth()).toBe(MAX_HEALTH - 30);
        });

        it("accumulates across multiple repairs", () => {
            car.undoDamage(10);
            car.undoDamage(15);
            expect(car.getHealth()).toBe(MAX_HEALTH - 25);
        });

        it("does nothing when the amount is 0", () => {
            car.undoDamage(0);
            expect(car.getHealth()).toBe(MAX_HEALTH - 50);
        });

        it("can reach exactly MAX_HEALTH", () => {
            car.undoDamage(50);
            expect(car.getHealth()).toBe(MAX_HEALTH);
        });

        it("caps at MAX_HEALTH when the repair is larger than the damage", () => {
            car.undoDamage(80);
            expect(car.getHealth()).toBe(MAX_HEALTH);
        });

        it("stays at MAX_HEALTH when repairing an undamaged car", () => {
            const fresh = new Car();
            fresh.undoDamage(10);
            expect(fresh.getHealth()).toBe(MAX_HEALTH);
        });

        it("caps at MAX_HEALTH for an amount of Infinity", () => {
            car.undoDamage(Infinity);
            expect(car.getHealth()).toBe(MAX_HEALTH);
        });

        it.each([-10, -Infinity, NaN])("throws for an invalid amount (%s) and leaves health unchanged", (amount) => {
            expect(() => car.undoDamage(amount)).toThrow(RangeError);
            expect(car.getHealth()).toBe(MAX_HEALTH - 50);
        });
    });

    describe("toJSON: returns a deep copy of the car's data for saving", () => {
        it("returns the default data for a new car", () => {
            expect(car.toJSON()).toEqual(Car.defaultData());
        });

        it("reflects changes made through the setters", () => {
            car.setColor('green');
            car.upgradeEngine();
            car.updateSpeedMultiplier();
            car.inflictDamage(40);

            const json = car.toJSON();
            expect(json.skin).toBe('green');
            expect(json.cosmetics).toEqual([]);
            expect(json.engineLevel).toBe(1);
            expect(json.speedMultiplier).toBeCloseTo(1 + ENGINE_SPEED_BONUS_PER_LEVEL);
            expect(json.upgrades).toEqual([]);
            expect(json.health).toBe(MAX_HEALTH - 40);
        });

        it("mutating the returned object does not change the car", () => {
            const custom = new Car(validSave());
            const json = custom.toJSON();
            json.skin = 'red';
            json.engineLevel = 0;
            json.upgrades.length = 0;
            json.cosmetics.push('decal');
            json.health = 0;
            expect(custom.toJSON()).toEqual(validSave());
        });

        it("round-trips through JSON.stringify and fromSave without losing data", () => {
            const original = new Car(validSave());
            const restored = Car.fromSave(JSON.parse(JSON.stringify(original)));
            expect(restored.toJSON()).toEqual(original.toJSON());
        });
    });

    describe("fromSave: builds a car from saved (untrusted) data, using defaults for missing or invalid fields", () => {
        describe("missing or empty saves fall back to the defaults", () => {
            it("undefined save", () => {
                expect(Car.fromSave(undefined).toJSON()).toEqual(Car.defaultData());
            });

            it("null save", () => {
                expect(fromRaw(null).toJSON()).toEqual(Car.defaultData());
            });

            it("empty object save", () => {
                expect(Car.fromSave({}).toJSON()).toEqual(Car.defaultData());
            });

            it("save where every field is null", () => {
                const allNull = {
                    skin: null, engineLevel: null, speedMultiplier: null,
                    upgrades: null, cosmetics: null, health: null,
                };
                expect(fromRaw(allNull).toJSON()).toEqual(Car.defaultData());
            });

            it("save where every field is undefined", () => {
                const allUndefined = {
                    skin: undefined, engineLevel: undefined, speedMultiplier: undefined,
                    upgrades: undefined, cosmetics: undefined, health: undefined,
                };
                expect(fromRaw(allUndefined).toJSON()).toEqual(Car.defaultData());
            });
        });

        describe("valid saves are loaded as-is", () => {
            it("loads every field of a complete save", () => {
                expect(Car.fromSave(validSave()).toJSON()).toEqual(validSave());
            });

            it("keeps falsy-but-valid values like 0 instead of replacing them", () => {
                const loaded = Car.fromSave({ engineLevel: 0, speedMultiplier: 0, health: 0 });
                expect(loaded.getEngineLevel()).toBe(0);
                expect(loaded.getSpeedMultiplier()).toBe(0);
                expect(loaded.getHealth()).toBe(0);
            });

            it("keeps empty arrays", () => {
                const loaded = Car.fromSave({ upgrades: [], cosmetics: [] });
                expect(loaded.getUpgrades()).toEqual([]);
                expect(loaded.getCosmetics()).toEqual([]);
            });

            it("fills only the missing fields of a partial save with defaults", () => {
                const loaded = Car.fromSave({ skin: 'blue', health: 20 });
                expect(loaded.toJSON()).toEqual({ ...Car.defaultData(), skin: 'blue', health: 20 });
            });

            it("ignores unknown extra fields", () => {
                const loaded = fromRaw({ ...validSave(), coins: 500 });
                expect(loaded.toJSON()).toEqual(validSave());
            });

            it("copies the save so later changes to it do not affect the car", () => {
                const save = validSave();
                const loaded = Car.fromSave(save);
                save.upgrades.push('Extra Time');
                save.cosmetics.length = 0;
                save.health = 99;
                expect(loaded.toJSON()).toEqual(validSave());
            });
        });
    });
});