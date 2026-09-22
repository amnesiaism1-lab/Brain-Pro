# Phương Pháp Luận: Kiểm Thử Dựa Trên Test Oracle (Oracle-Driven Testing)

> **Mục tiêu**: Nâng tầm tư duy kiểm thử từ mức "kiểm tra nút bấm giao diện" lên mức "thẩm định chân lý và tính toàn vẹn của hệ thống".

---

## 1. Nguồn Gốc Bài Toán Test Oracle (The Oracle Problem)
Trong kỹ thuật phần mềm và lý thuyết kiểm thử:
> **The Oracle Problem**: Thách thức trong việc xác định liệu kết quả đầu ra của một lần thực thi phần mềm là đúng hay sai một cách khách quan, độc lập với chính phần mềm đó.

Nếu người viết test chỉ nhìn vào màn hình và thấy phần mềm hiển thị kết quả gì thì viết assert kết quả đó, thì test đó **hoàn toàn vô nghĩa** vì nó đang dùng chính phần mềm bị lỗi làm chân lý!

---

## 2. Các Tầng Chân Lý Kiểm Thử (Oracle Taxonomy)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. ALGEBRAIC & BALANCE INVARIANTS (Bất Biến Đại Số & Cân Bằng)          │
│    - Tổng số dư hệ thống trước và sau giao dịch không đổi (bảo toàn tiền)│
│    - Số dư mới = Số dư cũ - Số tiền chuyển - Phí giao dịch              │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 2. STATE MACHINE CONSTRAINTS (Ràng Buộc Chuyển Dịch Trạng Thái)        │
│    - Trạng thái chỉ có thể biến đổi theo đồ thị trạng thái FSM hợp lệ   │
│    - Một đơn hàng đã HỦY (Cancelled) không bao giờ được phép GIAO HÀNG   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 3. CROSS-TIER CONSISTENCY (Nhất Quán Đa Tầng: UI - API - DB)           │
│    - Dữ liệu hiển thị trên Web Adapter phải khớp 100% với JSON từ API  │
│    - JSON từ API phải phản ánh trung thực bản ghi lưu trữ trong Database│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cách Thẩm Định Oracle Thực Chiến Qua Playwright

```typescript
// Ví dụ: Kiểm thử giao dịch nạp tiền $100 với phí 2% ($2)
test('Thẩm định Oracle cho giao dịch Nạp Tiền', async ({ page, executionRecord }) => {
  // 1. Ghi nhận trạng thái trước (Before State)
  const initialBalanceText = await page.getByTestId('user-balance').innerText();
  const initialBalance = parseFloat(initialBalanceText.replace(/[^0-9.-]+/g, ''));
  const depositAmount = 100.00;
  const feeRate = 0.02;

  // 2. Tính toán chân lý kỳ vọng dựa trên Test Oracle (Không dựa vào UI)
  const expectedFee = depositAmount * feeRate; // $2.00
  const expectedNetDeposit = depositAmount - expectedFee; // $98.00
  const expectedNewBalance = initialBalance + expectedNetDeposit;

  // 3. Thực hiện hành động nạp tiền
  await page.getByLabel('Số tiền nạp').fill(depositAmount.toString());
  await page.getByRole('button', { name: 'Xác nhận nạp tiền' }).click();

  // 4. Khẳng định đa chiều (Technical Observations measuring Oracle)
  // Observation 1: Phí hiển thị đúng
  await expect(page.getByTestId('fee-amount')).toHaveText(`$${expectedFee.toFixed(2)}`);
  
  // Observation 2: Số dư mới đạt chuẩn bất biến
  await expect(page.getByTestId('user-balance')).toHaveText(`$${expectedNewBalance.toFixed(2)}`);

  // Observation 3: Trạng thái giao dịch
  await expect(page.getByTestId('tx-status')).toHaveText('SUCCESS');

  // Ghi nhận Oracle thỏa mãn
  executionRecord.oracleEvaluations.push({
    oracleId: 'ORACLE-DEPOSIT-MATH',
    isSatisfied: true,
    explanation: `Bất biến số dư thỏa mãn: ${initialBalance} + ${expectedNetDeposit} = ${expectedNewBalance}`
  });
});
```
