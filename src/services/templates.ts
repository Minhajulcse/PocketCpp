export const CP_TEMPLATE_CPP = `// Pocket C++ IDE - Competitive Programming Starter
#include <bits/stdc++.h>
using namespace std;

void solve() {
    int a, b, c;
    if (cin >> a >> b >> c) {
        cout << a + b + c << "\\n";
    }
}

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t = 1;
    // cin >> t; // Uncomment if multiple test cases
    while (t--) {
        solve();
    }
    return 0;
}
`;

export const HELLO_WORLD_CPP = `// Pocket C++ IDE - Standard C++
#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}
`;

export const STANDARD_C = `// Pocket C++ IDE - Standard C
#include <stdio.h>

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("%d\\n", a + b);
    } else {
        printf("Hello from C!\\n");
    }
    return 0;
}
`;

export const VECTOR_SORT_CPP = `// Pocket C++ IDE - Vector & Algorithm Demo
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;

    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }

    sort(a.begin(), a.end());

    for (int x : a) {
        cout << x << " ";
    }
    cout << "\\n";

    return 0;
}
`;
