#include "n_list_dialog.h"
#include "ui_n_list_dialog.h"

NListDialog::NListDialog(QWidget *parent) : QDialog(parent), ui(new Ui::NListDialog)
{
    ui->setupUi(this);

    connect(ui->listWidget, SIGNAL(doubleClicked(QModelIndex)), this, SLOT(accept()));
    connect(ui->lineEdit, SIGNAL(textChanged(QString)), this, SLOT(filterTextList(QString)));
}

void NListDialog::setTextList(const QStringList &list) {
    ui->listWidget->addItems(list);
}

QString NListDialog::selectedText() {
    QListWidgetItem *item = ui->listWidget->currentItem();
    return item->text();
}

void NListDialog::setCurrentText(const QString &text) {
    QList<QListWidgetItem*> items = ui->listWidget->findItems(text, Qt::MatchFixedString);
    if (items.length() == 0) {
        return;
    }

    ui->listWidget->setCurrentItem(items[0]);
}

void NListDialog::filterTextList(const QString &text) {
    int count = ui->listWidget->count();
    for (int i = 0; i < count; i++) {
        QListWidgetItem *item = ui->listWidget->item(i);
        if (item->text().contains(text)) {
            item->setHidden(false);
        } else {
            item->setHidden(true);
        }
    }
}

NListDialog::~NListDialog()
{
    delete ui;
}
