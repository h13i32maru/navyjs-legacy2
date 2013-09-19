#include "nutil.h"

NUtil::NUtil()
{
}

void NUtil::expand(QStringList &list, int size) {
    int s = size - list.size();
    if (s <= 0) {
        return;
    }

    for (int i = 0; i < s; i++) {
        list.append("");
    }
}
