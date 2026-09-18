import { Coupon } from './coupon.entity';

describe('Coupon', () => {
  it('calculates a 10% discount over the subtotal', () => {
    const coupon = Coupon.create({ id: 1, code: '10OFF', discountPercentage: 10 });

    expect(coupon.calculateDiscount(200)).toBe(20);
  });

  it('calculates a 15% discount over the subtotal', () => {
    const coupon = Coupon.create({ id: 2, code: '15OFF', discountPercentage: 15 });

    expect(coupon.calculateDiscount(269.7)).toBe(40.46);
  });

  it('rounds the discount to two decimal places', () => {
    const coupon = Coupon.create({ id: 1, code: '10OFF', discountPercentage: 10 });

    expect(coupon.calculateDiscount(9.995)).toBeCloseTo(1, 2);
  });
});
