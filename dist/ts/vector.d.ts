export default class Vector {
    x: number;
    y: number;
    constructor(x: number, y: number);
    static zeroVector(): Vector;
    static fromScalar(s: number): Vector;
    /**
     * -pi to pi
     */
    static angleBetween(v1: Vector, v2: Vector): number;
    /**
     * Tests whether a point lies to the left of a line
     * @param  {Vector} linePoint     Point on the line
     * @param  {Vector} lineDirection
     * @param  {Vector} point
     * @return {Vector}               true if left, false otherwise
     */
    static isLeft(linePoint: Vector, lineDirection: Vector, point: Vector): boolean;
    add(v: Vector): Vector;
    /**
     * Angle in radians to positive x-axis between -pi and pi
     */
    angle(): number;
    clone(): Vector;
    copy(v: Vector): Vector;
    cross(v: Vector): number;
    distanceTo(v: Vector): number;
    distanceToSquared(v: Vector): number;
    divide(v: Vector): Vector;
    divideScalar(s: number): Vector;
    dot(v: Vector): number;
    equals(v: Vector): boolean;
    length(): number;
    lengthSq(): number;
    multiply(v: Vector): Vector;
    multiplyScalar(s: number): Vector;
    negate(): Vector;
    normalize(): Vector;
    /**
     * Angle in radians
     */
    rotateAround(center: Vector, angle: number): Vector;
    set(v: Vector): Vector;
    setX(x: number): Vector;
    setY(y: number): Vector;
    setLength(length: number): Vector;
    sub(v: Vector): Vector;
}
