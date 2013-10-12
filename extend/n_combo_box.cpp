#include "n_combo_box.h"
#include "extend/n_completer.h"

#include <QDebug>

NComboBox::NComboBox(QWidget *parent) : QComboBox(parent) {
    QStringList list;
    mCompleter = new NCompleter(list, this);
}

void NComboBox::setList(const QStringList &list) {
    blockSignals(true);

    QString current = currentText();
    clear();
    addItems(list);
    setCurrentText(current);

    mCompleter->setStringList(list);
    if (mCompleter != completer()) {
        setCompleter(mCompleter);
        connect(this, SIGNAL(currentTextChanged(QString)), mCompleter, SLOT(update(QString)));
    }

    blockSignals(false);
}
