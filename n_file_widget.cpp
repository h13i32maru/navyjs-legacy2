#include "n_file_widget.h"

NFileWidget::NFileWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : QWidget(parent)
{
    mProjectDir = projectDir;
    mFilePath = filePath;
}

QString NFileWidget::filePath() {
    return mFilePath;
}

void NFileWidget::setFilePath(const QString &filePath) {
    mFilePath = filePath;
}

bool NFileWidget::save() {
    bool ret = innerSave();

    if (ret) {
        mChanged = false;
    }

    return ret;
}

bool NFileWidget::isChanged() {
    return mChanged;
}

void NFileWidget::changed() {
    mChanged = true;

    emit this->changed(this);
}
