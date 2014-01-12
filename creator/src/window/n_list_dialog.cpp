#include "n_list_dialog.h"
#include "ui_n_list_dialog.h"

NListDialog::NListDialog(QWidget *parent) : QDialog(parent), ui(new Ui::NListDialog)
{
    ui->setupUi(this);

    connect(ui->listWidget, SIGNAL(doubleClicked(QModelIndex)), this, SLOT(accept()));
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

NListDialog::~NListDialog()
{
    delete ui;
}
