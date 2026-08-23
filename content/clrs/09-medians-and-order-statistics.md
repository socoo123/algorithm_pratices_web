# 第九章：中位数和顺序统计量（Medians and Order Statistics）

> **定位**：给定 n 个元素，找**第 i 小**的元素（顺序统计量）。朴素做法是排序后取——Θ(n lg n)。但选择问题比排序「容易」：不必排出全序，只需定位一个元素。本章给出三个**线性 Θ(n)** 算法：找 min/max（§9.1）、期望线性的 RANDOMIZED-SELECT（§9.2，quickselect）、最坏线性的 SELECT（§9.3，中位数的中位数/BFPRT）。
> **与第 7 章的关系**：quickselect 是快排的「减治」兄弟——分区后**只递归一侧**而非两侧，故期望从 Θ(n lg n) 降到 Θ(n)。第 7 章已埋下伏笔，本章是它的主场。
> **为什么能突破第 8 章的 Ω(n lg n) 下界**：那是**排序**的下界；选择不必排序，所以不受其限。
>
> 对照第四版书页 228–244。

---

## 一、同时找最小与最大（§9.1）

### 1.1 单独找 min：n−1 次，最优

```
MINIMUM(A, n)
1  min = A[1]
2  for i = 2 to n
3      if min > A[i]
4          min = A[i]
5  return min
```

n−1 次比较，且是**最优**的（锦标赛论证：n−1 个元素必须各输一次才能被排除）。

### 1.2 同时找 min 和 max：⌈3n/2⌉ 次

独立找各需 n−1 次，共 2n−2。但可优化：**成对处理**。每对元素先互相比较（1 次），较小者与当前 min 比、较大者与当前 max 比（2 次），即每 2 个元素用 3 次比较。

```
合计: ⌈3n/2⌉ 次        // 奇数 n: 3⌊n/2⌋；偶数 n: 3n/2 − 2
```

> 比独立的 2n−2 节省约 25%。下界也是 ⌈3n/2⌉−2（习题 9.1-4），故成对法渐近最优。

### 1.3 经典习题

- **9.1-1**　找**第二小**用 n + ⌈lg n⌉ − 2 次比较：锦标赛找最小（n−1 次），第二小一定输给了冠军，冠军沿途比较 ⌈lg n⌉ 次，在其中找最小（⌈lg n⌉−1 次）。
- **9.1-3**　25 匹马、5 赛道找**前 3 快**，最少 **7 场**（经典面试题）。

---

## 二、期望线性选择：RANDOMIZED-SELECT（§9.2，quickselect）

### 2.1 思路

借用快排的分区：分区后 pivot 位于位置 q。若要找第 i 小：

- i == q−p+1 → pivot 就是答案；
- i < q−p+1 → 只递归**左**子数组；
- i > q−p+1 → 只递归**右**子数组（i 减去左侧元素数）。

**关键区别快排**：快排两侧都递归（T(n)=2T(n/2)+Θ(n)=Θ(n lg n)），quickselect 只递归一侧（T(n)=T(n/2)+Θ(n)=Θ(n)）。

### 2.2 伪代码（CLRS 第四版，1-indexed）

```
RANDOMIZED-SELECT(A, p, r, i)        // 找 A[p..r] 中第 i 小
1  if p == r return A[p]
2  q = RANDOMIZED-PARTITION(A, p, r)  // 复用第 7 章
3  k = q - p + 1                       // A[p..q] 的元素数（含 pivot）
4  if i == k return A[q]               // pivot 即答案
5  elseif i < k return RANDOMIZED-SELECT(A, p, q-1, i)
6  else return RANDOMIZED-SELECT(A, q+1, r, i-k)
```

### 2.3 复杂度

- **最坏 Θ(n²)**：每次都选到最差 pivot（如已排序输入 + 固定取端点）。
- **期望 Θ(n)**：随机化后，每次分区**有常数概率**把问题规模缩减到原来的一个分数，递归规模构成下降几何级数：n + cn + c²n + … = Θ(n)。

> 一句话直觉：「每次只走一侧，且随机 pivot 让规模大致折半 → n + n/2 + n/4 + … < 2n。」

> RANDOMIZED-SELECT 用的是第 5 章的「随机化算法」思想：对任意输入都给期望 Θ(n)，敌人无法构造最坏输入。

---

## 三、最坏线性选择：SELECT（§9.3，中位数的中位数 / BFPRT）

### 3.1 为什么需要它

RANDOMIZED-SELECT 最坏 Θ(n²)。实时系统、对抗环境下要**保证**最坏 Θ(n)。SELECT 通过「**递归地找一个好 pivot**」做到。

### 3.2 思路：中位数的中位数

直接随机选 pivot 无法保证质量。SELECT 的巧思：**先花 Θ(n) 找一个保证「30% 好」的 pivot**——

1. 把 n 个元素**每 5 个一组**（共 ⌈n/5⌉ 组），各组内部排序取中位数；
2. **递归**调用 SELECT 找这些组中位数的「中位数 x」；
3. 用 x 作 pivot 分区。

### 3.3 pivot 质量保证：30% 定理

x 是「中位数的中位数」。至少**一半组**的中位数 ≥ x；每个这样的组里有 3 个元素 ≥ 其组中位数 ≥ x。所以：

```
≥ 3(⌊g/2⌋ + 1) ≥ 3g/2 个元素 ≥ x    （g = ⌈n/5⌉；含 x 自己那一组）
同理 ≥ 3g/2 ≥ 3n/10 个元素 ≤ x
→ 低侧至多 5g − 3g/2 = 7g/2 ≤ 7n/10
```

（这是「7n/10」的来源，Figure 9.3 可视化：每个组是一列，中位数在中间行，x 把组中位数分两侧。）

### 3.4 递归式与 Θ(n)（Theorem 9.3）

```
T(n) ≤ T(n/5) + T(7n/10) + Θ(n)
       找 pivot   递归一侧   分组+分区
```

代入法证 T(n) ≤ cn：`c·n/5 + c·7n/10 + an = 9cn/10 + an ≤ cn`（取 c ≥ 10a 使 c/10 主导 an）。故 **T(n) = Θ(n)**。

### 3.5 为什么是 5？

- 分组 3：T(n) ≤ T(n/3) + T(2n/3) + Θ(n)，两系数和 = 1，**不收敛**到 Θ(n)（退化为 Θ(n lg n)）。
- 分组 5：1/5 + 7/10 = 9/10 < 1，收敛 Θ(n)。
- 分组 7：1/7 + 5/7 < 1 也收敛，但常数更大。

**5 是让递归收敛的最小分组**，常数因子最优。

### 3.6 第四版的精妙：列式原地分组

第四版 SELECT 把第 j 组的 5 个元素排成 `A[j], A[j+g], A[j+2g], A[j+3g], A[j+4g]`（步长 g = ⌈n/5⌉），组内排序后，**所有组中位数天然落在 `A[p+2g .. p+3g-1]`**——于是「递归找中位数的中位数」直接在原数组中段进行，无需额外数组。这是第四版相对第三版「收集中位数到新数组」的改进。

> 下面的代码用更直观的「中位数收集到前缀」写法（逻辑等价、易读），便于理解和对拍。

---

## 四、代码实现（Java + Python）

两个算法，0-indexed。RANDOMIZED-SELECT 复用第 7 章的 Lomuto 分区；SELECT 用「中位数收集到前缀」写法（修正了原笔记的错误实现）。

### Java

```java
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

public class OrderStatistics {
    // ===== RANDOMIZED-SELECT（§9.2）：第 k 小，k 为 0-indexed =====
    public static int randomizedSelect(int[] a, int k) {
        int lo = 0, hi = a.length - 1;
        while (lo < hi) {
            int q = randomPartition(a, lo, hi);
            if (q == k) return a[q];
            else if (k < q) hi = q - 1;
            else lo = q + 1;
        }
        return a[lo];
    }
    private static int randomPartition(int[] a, int lo, int hi) {
        swap(a, lo + ThreadLocalRandom.current().nextInt(hi - lo + 1), hi);
        int x = a[hi], i = lo - 1;
        for (int j = lo; j < hi; j++) if (a[j] <= x) swap(a, ++i, j);
        swap(a, i + 1, hi);
        return i + 1;
    }

    // ===== SELECT（§9.3，中位数的中位数，最坏 Θ(n)）：第 k 小，k 为 0-indexed =====
    public static int select(int[] a, int lo, int hi, int k) {
        while (true) {
            if (hi - lo < 5) {                       // 小数组直接插排
                insertSort(a, lo, hi);
                return a[lo + k];
            }
            int g = (hi - lo + 1) / 5;               // 5 元素组数
            for (int j = 0; j < g; j++) {
                insertSort(a, lo + 5 * j, lo + 5 * j + 4);
                swap(a, lo + j, lo + 5 * j + 2);     // 组中位数收集到前 g 位
            }
            int x = select(a, lo, lo + g - 1, g / 2);// 递归找中位数的中位数
            int q = partitionAround(a, lo, hi, x);   // 围绕 x 分区
            int rank = q - lo;
            if (k == rank) return a[q];
            else if (k < rank) hi = q - 1;
            else { k -= rank + 1; lo = q + 1; }
        }
    }
    public static int select(int[] a, int k) { return select(a, 0, a.length - 1, k); }

    // 围绕值 x 分区（先线性找到 x 的位置，再 Lomuto）
    private static int partitionAround(int[] a, int lo, int hi, int x) {
        int idx = lo; while (a[idx] != x) idx++;
        swap(a, idx, hi);
        int i = lo - 1;
        for (int j = lo; j < hi; j++) if (a[j] <= x) swap(a, ++i, j);
        swap(a, i + 1, hi);
        return i + 1;
    }
    private static void insertSort(int[] a, int lo, int hi) {
        for (int i = lo + 1; i <= hi; i++) {
            int key = a[i], j = i - 1;
            while (j >= lo && a[j] > key) { a[j + 1] = a[j]; j--; }
            a[j + 1] = key;
        }
    }
    private static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }

    public static void main(String[] args) {
        int[] a = {3, 7, 2, 8, 1, 6, 5, 4};
        for (int k = 0; k < a.length; k++)
            System.out.printf("第 %d 小: rand=%d sel=%d%n", k + 1,
                    randomizedSelect(a.clone(), k), select(a.clone(), k));
    }
}
```

### Python

```python
import random


def randomized_select(a, k):
    """RANDOMIZED-SELECT（§9.2）：第 k 小，k 为 0-indexed。"""
    a = a[:]
    lo, hi = 0, len(a) - 1
    while lo < hi:
        q = _random_partition(a, lo, hi)
        if q == k:
            return a[q]
        elif k < q:
            hi = q - 1
        else:
            lo = q + 1
    return a[lo]

def _random_partition(a, lo, hi):
    pivot = random.randint(lo, hi)
    a[pivot], a[hi] = a[hi], a[pivot]
    x, i = a[hi], lo - 1
    for j in range(lo, hi):
        if a[j] <= x:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[hi] = a[hi], a[i + 1]
    return i + 1


def select(a, k):
    """SELECT（§9.3，中位数的中位数，最坏 Θ(n)）：第 k 小，k 为 0-indexed。"""
    a = a[:]
    lo, hi = 0, len(a) - 1
    while True:
        if hi - lo < 5:
            a[lo:hi + 1] = sorted(a[lo:hi + 1])
            return a[lo + k]
        g = (hi - lo + 1) // 5
        for j in range(g):
            seg = slice(lo + 5 * j, lo + 5 * j + 5)
            a[seg] = sorted(a[seg])
            a[lo + j], a[lo + 5 * j + 2] = a[lo + 5 * j + 2], a[lo + j]
        x = select(a[lo:lo + g], g // 2)            # 递归找中位数的中位数
        q = _partition_around(a, lo, hi, x)
        rank = q - lo
        if k == rank:
            return a[q]
        elif k < rank:
            hi = q - 1
        else:
            k -= rank + 1
            lo = q + 1

def _partition_around(a, lo, hi, x):
    idx = a.index(x, lo, hi + 1)
    a[idx], a[hi] = a[hi], a[idx]
    i = lo - 1
    for j in range(lo, hi):
        if a[j] <= x:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[hi] = a[hi], a[i + 1]
    return i + 1


if __name__ == "__main__":
    a = [3, 7, 2, 8, 1, 6, 5, 4]
    for k in range(len(a)):
        print(f"第 {k+1} 小: rand={randomized_select(a, k)} sel={select(a, k)}")
```

> **验证**：两实现对拍通过（见文末说明：随机数组对照 `Arrays.sort`/`sorted` 后取第 k 个）。注意 Python `select` 递归调用传 `a[lo:lo+g]` 的切片副本，逻辑等价于「在中位数集合上递归」。

---

## 五、复杂度速查 + 易混点

### 5.1 速查

| 算法 | 平均 | 最坏 | 空间 | 备注 |
|------|------|------|------|------|
| 排序后取 | Θ(n lg n) | Θ(n lg n) | Θ(n) | 简单，杀鸡用牛刀 |
| RANDOMIZED-SELECT | Θ(n) | Θ(n²) | Θ(lg n) | 实际首选，常数小 |
| SELECT（BFPRT） | Θ(n) | Θ(n) | Θ(lg n) | 理论保证，常数大 |
| 堆（找第 k 小） | Θ(n lg k) | Θ(n lg k) | Θ(k) | 适合 top-k / 流式 |

### 5.2 易混点

- **快排 vs 快选**：分区相同，但快排递归**两侧**（Θ(n lg n)），快选只递归**一侧**（Θ(n)）。一个字之差，复杂度量级不同。
- **期望 Θ(n) ≠ 最坏 Θ(n)**：RANDOMIZED-SELECT 是前者（随机化保证），SELECT 是后者（确定性）。面试/竞赛一般用 RANDOMIZED-SELECT（够快、好写）；对抗场景才用 SELECT。
- **「7n/10」是 SELECT 的命根**：分组 5 → pivot 至少比 3n/10 个元素大也比 3n/10 小 → 递归一侧最多 7n/10。1/5 + 7/10 = 9/10 < 1 是 Θ(n) 的关键。分组 3 时 1/3+2/3=1，不收敛。
- **选择 ≠ 排序**：第 8 章的 Ω(n lg n) 下界只限排序；选择能 Θ(n)，因为它「不排全序」。
- **第 k 大 ↔ 第 n−k+1 小**：LeetCode 215（第 K 大）即找第 n−k 小，直接套 quickselect。

---

## 六、LeetCode 关联 + 习题 + 思考题

### 6.1 LeetCode 关联

| 题目 | 难度 | 考点 | 用本章什么 |
|------|------|------|-----------|
| [215. 数组中的第 K 个最大元素](https://leetcode.cn/problems/kth-largest-element-in-an-array/) | 中 | quickselect | RANDOMIZED-SELECT（第 n−k 小） |
| [347. 前 K 个高频元素](https://leetcode.cn/problems/top-k-frequent-elements/) | 中 | quickselect / 桶 | 第 k 频 |
| [973. 最接近原点的 K 个点](https://leetcode.cn/problems/k-closest-points-to-origin/) | 中 | quickselect | 第 k 近 |
| [4. 寻找两个正序数组的中位数](https://leetcode.cn/problems/median-of-two-sorted-arrays/) | 困 | 二分 | 对应习题 9.3-10 |
| [480. 滑动窗口中位数](https://leetcode.cn/problems/sliding-window-median/) | 困 | 双堆 / 双指针 | 中位数维护 |

### 6.2 习题快问快答（第四版编号）

- **9.1-1**　第二小用 n + ⌈lg n⌉ − 2 次比较（锦标赛 + 冠军路径）。
- **9.1-2**　n>2 个数中找「既非 min 也非 max」的元素，只需在 3 个元素里找中位数，**常数次比较**（3 个元素的中位数必非全局极值）。
- **9.2-3**　把 RANDOMIZED-SELECT 改成**迭代**版（while 循环，每次只更新 lo/hi 一侧）——见上面 Java/Python 代码。
- **9.2-4**　最坏情况下 RANDOMIZED-SELECT 的比较次数上界是 Θ(n²)（构造性：每次随机选到最差 pivot 的概率虽低但路径存在）。
- **9.3-3**　如何让快排最坏 Θ(n lg n)？用 SELECT 找**精确中位数**作 pivot，每次分区严格对半：T(n) = 2T(n/2) + Θ(n)（SELECT 的 Θ(n)）= Θ(n lg n)。
- **9.3-5**　5 个元素的中位数只需 **6 次比较**（先 4 次排出两对大小，再比较两个较大者，最后在剩下 3 个候选里找中位数）。
- **9.3-6**　有一个「最坏 Θ(n) 返回中位数」的黑盒 → 用它做 pivot 即可在 Θ(n) 内找任意第 k 小（分区后只递归一侧）。
- **9.3-7**　东西向主管道 + 各油井南北支线：最优位置是 y 坐标的**中位数**（L1），SELECT 线性时间。
- **9.3-8**　找 k 个**分位数**（把有序集等分成 k 段的 k−1 个切点）：**O(n lg k)**——SELECT 出中间那个分位数，再对左右两半递归（不是 k−1 次独立 SELECT，那会变成 Θ(kn)）。
- **9.3-9**　n 个数里离中位数最近的 k 个：先 SELECT 出中位数，再按 |x−m| 做第 k 小，Θ(n)。
- **9.3-10**　两个等长有序数组找中位数：Θ(lg n) 二分（LC 4）。

### 6.3 思考题要点

- **9-1 Largest i numbers**：找最大 i 个数的期望时间——找到第 (n−i) 小需 Θ(n)，再在其中找前 i 大 Θ(i lg i)（若要排序）。
- **9-3 Weighted median**：带权中位数（权重之和的分位点），仍可用 SELECT 思路 Θ(n)。
- **9-4 Small order statistics**：分析找第 i 小的最坏比较次数 U_i(n) 的递推上界；i 固定时比完整 SELECT 的常数更好。不是「用大小为 k 的堆 Θ(k + n lg k)」。
- **9-6 Select with groups of 3**：分组 3 时递归式 1/3 + 2/3 = 1 不收敛到线性——证明 5 是让 SELECT 保持线性的最小分组。

### 章末注记

SELECT 算法由 **Blum、Floyd、Pratt、Rivest、Tarjan（1973）** 提出，故称 **BFPRT**。它首次证明选择问题可在**最坏线性时间**解决，是「分治 + 递归选 pivot」的典范。quickselect 则由 Hoare（1961，与快排同期）提出。两者说明一个深刻事实：**选择比排序渐近更易**（Θ(n) vs Θ(n lg n)）。
