#include "n_combo_box.h"
#include "extend/n_completer.h"

#include <QDebug>

NComboBox::NComboBox(QWidget *parent) : QComboBox(parent) {
    setEditable(true);
    QStringList list;
    mCompleter = new NCompleter(list, this);
}

void NComboBox::setList(const QStringList &list) {
    // リスト変更時に不要なシグナルが発生して補完がおかしくなるのでシグナルを一時止める
    blockSignals(true);

    QString current = currentText();
    clear();
    addItems(list);
    setCurrentText(current);

    mCompleter->setStringList(list);

    // コンストラクタでcompleterを設定しても何故かQComboBox組み込みのcompleterに上書きされてしまうので、ここで設定している
    if (mCompleter != completer()) {
        setCompleter(mCompleter);
        connect(this, SIGNAL(currentTextChanged(QString)), mCompleter, SLOT(update(QString)));
    }

    blockSignals(false);
}
