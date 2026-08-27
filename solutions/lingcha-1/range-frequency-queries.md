# 区间内查询数字的频率（值 → 有序下标表 + 二分计数）

## 一、问题描述

请你设计一个数据结构，支持两种操作：

- `RangeFreqQuery(arr)`：用整数数组 `arr` 初始化；
- `query(left, right, value)`：返回子数组 `arr[left..right]`（**左右都闭**）中 `value` 出现的次数。

> 🔗 LeetCode 2080：https://leetcode.cn/problems/range-frequency-queries/
>
> 数据范围：`1 <= arr.length <= 10^5`，`1 <= arr[i], value <= 10^4`，
> 调用 `query` 至多 `10^5` 次，`0 <= left <= right < arr.length`。

**示例**

```
初始化：arr = [12, 33, 4, 56, 56, 56]

query(0, 2, 4)  → 1    // [12, 33, 4] 中 4 出现 1 次
query(0, 5, 56) → 3    // [12, 33, 4, 56, 56, 56] 中 56 出现 3 次
query(2, 3, 56) → 1    // [4, 56] 中 56 出现 1 次
query(0, 5, 7)  → 0    // 7 根本没出现过
```

**直观理解**

注意题目的「形态」：数组**初始化后就再也不变**，之后是海量的区间询问。这是典型的「静态数据 + 多次查询」——凡是这种形态，就该想到灵茶题单 §1.2 的套路：**花一次预处理把数据整理成有序结构，让每次查询只花 `O(log n)`**。如果数组会动态修改，那才轮到线段树出场；静态时，预处理 + 二分是最轻的解法。

---

## 二、暴力解法

每次查询老老实实扫一遍 `[left, right]`：

```python
class RangeFreqQuery:
    def __init__(self, arr: List[int]):
        self.arr = arr

    def query(self, left: int, right: int, value: int) -> int:
        cnt = 0
        for i in range(left, right + 1):
            if self.arr[i] == value:
                cnt += 1
        return cnt
```

### 复杂度

- **时间**：单次查询 `O(r - l + 1)`，最坏 `O(n)`；总共 `10^5` 次查询 × `10^5` 长度 = `O(nq) = 10^10`，必然超时。
- **空间**：`O(1)`。

### 🔴 瓶颈在哪里

每次查询都「从零开始」扫区间，完全没有利用「数组静态不变」这个白送的性质。同样的区间统计被重复计算了一遍又一遍——该把功夫花在初始化阶段。

---

## 三、优化探索（核心章节）

> 📚 本题在灵茶题单中属于 **§1.2 二分进阶（排序 / 预处理 + 二分查询）**。与同批 [2476 二叉搜索树最近节点查询](closest-nodes-queries-in-a-binary-search-tree.md) 一样：先把数据整理成有序结构（本题是哈希表「值 → 下标升序列表」），再让每次查询降为 `O(log n)`。

### 3.1 关键观察：每个值的下标列表天然有序

预处理：遍历 `arr`，把每个值出现的位置按顺序 `append` 到 `pos[value]`：

```python
for i, v in enumerate(arr):
    pos[v].append(i)
```

由于 `i` 递增，**每个列表天然升序，一步排序都不用**。以上面的示例为例：

| 值 | pos（出现下标） |
|----|----------------|
| 12 | `[0]` |
| 33 | `[1]` |
| 4  | `[2]` |
| 56 | `[3, 4, 5]` |

于是「`value` 在 `arr[left..right]` 出现几次」=「`pos[value]` 中落在 `[left, right]` 内的下标有几个」。列表升序，这些下标必然是**连续的一段**——问题从「数个数」变成「切两端」。

### 3.2 两次二分切出蓝色段

设 `p = pos[value]`（长度 `m`），要数落在 `[left, right]` 内的元素：

- **左端** = 第一个满足 `p[x] >= left` 的下标 `x`——「求最小」二分，即 `bisect_left(p, left)`；
- **右端** = 第一个满足 `p[x] > right` 的下标 `x`——同样是「求最小」二分，即 `bisect_left(p, right + 1)`（等价于 `bisect_right(p, right)`）；
- **答案 = 右端 − 左端**。

```mermaid
flowchart LR
    R["红色区<br/>下标 &lt; left"] --- G["蓝色区（要数的段）<br/>left ≤ 下标 ≤ right"] --- R2["红色区<br/>下标 &gt; right"]

    style R fill:#2b2d3a,stroke:#ff5555,color:#f8f8f2
    style G fill:#2b2d3a,stroke:#50fa7b,color:#f8f8f2
    style R2 fill:#2b2d3a,stroke:#ff5555,color:#f8f8f2
```

两个「切端点」的 check 在升序数组上都是**左假右真**：下标越靠后，`p[x]` 越大，越容易满足 `>= left` / `> right`。标准的红蓝染色、找最左蓝。

### 3.3 手写二分（对齐灵神「求最小」模板）

```
求满足 check(x) 的最小下标 x（红蓝染色）：
    l, r = 0, m                # 左闭右开 [0, m)，m 是哨兵（表示整段全红）
    while l < r:
        mid = (l + r) // 2
        if check(mid): r = mid      # mid 蓝 → 可行，收缩右界
        else:          l = mid + 1  # mid 红 → 不可行，收缩左界
    # 循环结束 l == r = 第一个蓝下标（可能等于哨兵 m）
```

两次二分共用这套骨架，只是 `check` 换了个条件——这正是灵神模板的好处：**模板不动，check 一换就是一道新题**。

```mermaid
flowchart TD
    A["query(left, right, value)"] --> B{"pos 有这个值?"}
    B -->|"没有"| Z["直接返回 0"]
    B -->|"有 p = pos"] --> C["二分①：找第一个 ≥ left<br/>check: p[mid] >= left"]
    C --> D["二分②：找第一个 > right<br/>check: p[mid] > right"]
    D --> E["返回 右端 - 左端"]

    style A fill:#2b2d3a,stroke:#f1fa8c,color:#f8f8f2
    style B fill:#2b2d3a,stroke:#8be9fd,color:#f8f8f2
    style Z fill:#2b2d3a,stroke:#ff5555,color:#f8f8f2
    style C fill:#2b2d3a,stroke:#8be9fd,color:#f8f8f2
    style D fill:#2b2d3a,stroke:#8be9fd,color:#f8f8f2
    style E fill:#2b2d3a,stroke:#50fa7b,color:#f8f8f2
```

### 3.4 一句话核心

> **预处理出「值 → 有序下标表」；查询 = 在这张表上数 `[left, right]` 那段蓝色的长度 = 「第一个 `> right` 的位置」−「第一个 `>= left` 的位置」。**

---

## 四、代码实现

### Python（主解：手写二分）

```python
from collections import defaultdict

class RangeFreqQuery:
    def __init__(self, arr: List[int]):
        self.pos = defaultdict(list)
        for i, v in enumerate(arr):       # 下标递增入表，列表天然有序
            self.pos[v].append(i)

    def query(self, left: int, right: int, value: int) -> int:
        p = self.pos.get(value)
        if not p:                          # 该值从未出现
            return 0
        # 二分①：第一个下标 >= left 的位置（求最小模板）
        l, r = 0, len(p)
        while l < r:
            mid = (l + r) // 2
            if p[mid] >= left:
                r = mid
            else:
                l = mid + 1
        first = l
        # 二分②：第一个下标 > right 的位置（等价于 >= right + 1）
        l, r = first, len(p)               # 左端之前的必然 < left，不用再看
        while l < r:
            mid = (l + r) // 2
            if p[mid] > right:
                r = mid
            else:
                l = mid + 1
        return l - first
```

**变量含义**

| 变量 | 含义 |
|------|------|
| `pos` | 哈希表：值 → 出现下标的升序列表 |
| `first` | 第一个 `>= left` 的下标在 `p` 中的位置（蓝色段起点） |
| 第二次二分的返回值 | 第一个 `> right` 的下标在 `p` 中的位置（蓝色段终点+1） |
| 返回值 | 两位置相减 = 蓝色段长度 = 出现次数 |

等价的 `bisect` 版本（Python 内置 C 实现，更快更短）：

```python
from bisect import bisect_left

    def query(self, left: int, right: int, value: int) -> int:
        p = self.pos.get(value)
        if not p:
            return 0
        i = bisect_left(p, left)           # 第一个 >= left
        j = bisect_left(p, right + 1)      # 第一个 > right
        return j - i
```

### Java（最优解同款写法）

```java
class RangeFreqQuery {
    private final Map<Integer, List<Integer>> pos = new HashMap<>();

    public RangeFreqQuery(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            pos.computeIfAbsent(arr[i], k -> new ArrayList<>()).add(i);
        }
    }

    public int query(int left, int right, int value) {
        List<Integer> p = pos.get(value);
        if (p == null) return 0;
        return lowerBound(p, right + 1) - lowerBound(p, left);
    }

    // 第一个 >= x 的下标（灵神求最小模板）
    private int lowerBound(List<Integer> p, int x) {
        int l = 0, r = p.size();            // 左闭右开，r 为哨兵
        while (l < r) {
            int mid = l + (r - l) / 2;
            if (p.get(mid) >= x) r = mid;
            else l = mid + 1;
        }
        return l;
    }
}
```

---

## 五、具体例子演示

以 `arr = [12, 33, 4, 56, 56, 56]` 端到端走一遍。预处理得到：

```
pos[12] = [0]
pos[33] = [1]
pos[4]  = [2]
pos[56] = [3, 4, 5]
```

**query(0, 5, 56)**：`p = [3, 4, 5]`。

- 二分①找第一个 `>= 0`：`p[0] = 3 >= 0` 一开始就真 → `first = 0`；
- 二分②找第一个 `> 5`：全部 `<= 5` → 收敛到哨兵 `3`；
- 答案 `3 - 0 = 3` ✓（三个 56 全在区间内）。

**query(2, 3, 56)**：`p = [3, 4, 5]`，逐轮跟踪两次二分。

二分①：找第一个 `>= left = 2` 的位置，`l = 0, r = 3`（哨兵）：

| 轮次 | l | mid | r | p[mid] | check：`>= 2` ? | 染色 | 动作 |
|------|---|-----|---|--------|------------------|------|------|
| 1 | 0 | 1 | 3 | 4 | ✓ | 蓝 | `r = 1` |
| 2 | 0 | 0 | 1 | 3 | ✓ | 蓝 | `r = 0` |
| 结束 | 0 | — | 0 | — | — | — | `first = 0` |

二分②：找第一个 `> right = 3` 的位置，`l = first = 0, r = 3`：

| 轮次 | l | mid | r | p[mid] | check：`> 3` ? | 染色 | 动作 |
|------|---|-----|---|--------|------------------|------|------|
| 1 | 0 | 1 | 3 | 4 | ✓ | 蓝 | `r = 1` |
| 2 | 0 | 0 | 1 | 3 | ✗ | 红 | `l = 1` |
| 结束 | 1 | — | 1 | — | — | — | 返回 `1 - 0 = 1` |

答案 **1** ✓——`arr[2..3] = [4, 56]`，56 恰好一次。

**query(0, 2, 4)**：`p = [2]`。二分①得 `0`（`2 >= 0`）；二分②：`2 > 2` 为假 → 收敛到哨兵 `1`；答案 `1 - 0 = 1` ✓。

**query(0, 5, 7)**：`pos` 里没有 7 这个键 → 直接返回 **0** ✓。

---

## 六、复杂度分析

| 方法 | 预处理 | 单次查询 | 总时间 | 空间 |
|------|--------|----------|--------|------|
| 暴力扫描 | `O(1)` | `O(n)` | `O(nq) = 10^10`，超时 | `O(1)` |
| 预处理 + 二分 | `O(n)` | `O(log n)` | `O(n + q log n) ≈ 1.7 * 10^6` | `O(n)` |

`log2(10^5) ≈ 17`，每次查询只做两趟共三十来次比较；预处理的一次 `O(n)` 摊到 `10^5` 次查询上微不足道。

---

## 七、对比总结

**§1.2「预处理 + 二分查询」家族对照**（同小节其余题解见同目录）：

| 题 | 预处理成什么 | 每次查询二分什么 |
|----|--------------|------------------|
| #2080 本篇 | 哈希：值 → 有序下标表 | 在下标表上切 `[left, right]` 段，数长度 |
| #2476 BST 最近节点查询 | 中序展开成有序数组 | `<= q` 的最大值与 `>= q` 的最小值 |
| #2300 咒语和药水的成功对数 | 排序 `potions` | 找成功后缀的起点 |
| #1385 两个数组间的距离值 | 排序 `arr2` | 判区间 `[x-d, x+d]` 是否非空 |
| #2070 每一个查询的最大美丽值 | 排序 + 前缀最大值 | 找最后一个 `price <= q` 的下标（求最大模板） |

**易错点**

1. **右端是 `> right` 不是 `>= right`**：区间右闭，`p[x] == right` 的那次出现必须数进去。用 `bisect_left(p, right + 1)` 表达最不容易错。
2. 两次二分都是「求最小」：`check` 满足 `r = mid`，不满足 `l = mid + 1`——与二分答案篇（同批 `koko-eating-bananas.md`）的模板一字不差，只是把「猜速度」换成了「找下标」。
3. 哨兵 `r = len(p)` 必须有：它表达「整段都满足条件」的极端情形（如二分②整段都 `<= right`）。
4. 值不存在直接判空返回 0；其实空列表跑二分也会得 `0 - 0 = 0`，但显式判空少两次循环，语义也更清楚。
5. 哈希表存的是**完整下标列表**，空间是 `O(n)` 级别（所有列表长度之和恰为 `n`），不要误写成 `O(n * 值域)`。

---

## 八、举一反三

| 题目 | 关系 |
|------|------|
| [2070. 每一个查询的最大美丽值](https://leetcode.cn/problems/most-beautiful-item-for-each-query/) | 同批姊妹篇（同 §1.2）：排序 + 前缀最大值 + 二分，见 `most-beautiful-item-for-each-query.md` |
| [1146. 快照数组](https://leetcode.cn/problems/snapshot-array/) | 同批姊妹篇（同 §1.2）：有序版本表 + 二分找最新，见 `snapshot-array.md` |
| [2476. 二叉搜索树最近节点查询](https://leetcode.cn/problems/closest-nodes-queries-in-a-binary-search-tree/) | 同小节：有序化 + 两次边界二分，见 `closest-nodes-queries-in-a-binary-search-tree.md` |
| [2300. 咒语和药水的成功对数](https://leetcode.cn/problems/successful-pairs-of-spells-and-potions/) | 同小节：排序 + 找后缀起点，见 `successful-pairs-of-spells-and-potions.md` |
| [981. 基于时间的键值存储](https://leetcode.cn/problems/time-based-key-value-store/) | 思想迁移：`key` → 按 timestamp 有序的值列表，`get` 时二分找 `<= t` 的最新值 |
| [2085. 统计出现过一次的公共字符串](https://leetcode.cn/problems/count-common-words-with-one-occurrence/) | 对照题：静态统计用哈希表就够，体会「什么时候才需要下标表 + 二分」 |

**思想迁移**

- 看到「静态数组 + 多次区间询问」，先想**预处理**：把询问需要的信息整理成有序结构（下标表 / 排序数组 / 前缀和 / 前缀 max），再让查询走 `O(log n)`。
- 本篇的 `pos` 表本质是「倒排索引」：搜索引擎统计某个词在哪些位置出现，用的就是这一招。
- 若数组会动态更新（`update` + 区间查询），有序表不够用，得上**每个节点带有序列表的线段树**或树状数组——那是另一个量级的工程，静态题千万别过度设计。
- 口诀：**「值变下标表，区间问频率；两刀切两端，右减左即齐。」**
